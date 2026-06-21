import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Capture interceptor handlers at module-init time
let mockAxiosInstance;
let capturedErrorHandler;

jest.unstable_mockModule('axios', () => ({
  default: {
    create: jest.fn(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((resolve, reject) => {
              capturedErrorHandler = reject;
            }),
          },
        },
      };
      return mockAxiosInstance;
    }),
  },
}));

jest.unstable_mockModule('../../../src/config/env.js', () => ({
  env: {
    GITLAB_BASE_URL: 'https://gitlab.example.com',
    GITLAB_PERSONAL_ACCESS_TOKEN: 'glpat-abc123',
  },
}));

jest.unstable_mockModule('@config-mcp/mcp-core', () => {
  const AppError = class AppError extends Error {
    constructor(message, statusCode = 500, code) {
      super(message);
      this.name = 'AppError';
      this.statusCode = statusCode;
      this.code = code;
    }
  };
  return {
    limiter: {
      schedule: jest.fn((fn) => fn()),
    },
    AppError,
    ValidationError: class ValidationError extends AppError {
      constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
      }
    },
    sanitizeHeaders: jest.fn((h) => h),
    sanitizeResponse: jest.fn((d) => d),
    sanitizeForLog: jest.fn((d) => d),
  };
});

const { get, getAll } = await import('../../../src/gitlab/gitlabClient.js');
const { GitlabError } = await import('../../../src/utils/errors.js');

describe('gitlabClient', () => {
  beforeEach(() => {
    // Reset only the per-request mocks, not the module-init mocks
    mockAxiosInstance.get.mockReset();
  });

  describe('axios instance creation', () => {
    it('should create an axios instance with the correct base URL and headers', async () => {
      const axiosMod = await import('axios');
      const axiosDefault = axiosMod.default;

      expect(axiosDefault.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://gitlab.example.com/api/v4',
          headers: expect.objectContaining({
            'PRIVATE-TOKEN': 'glpat-abc123',
          }),
        }),
      );
    });

    it('should register response interceptors', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('response interceptor', () => {
    it('should throw GitlabError on 401', () => {
      const error = {
        response: { status: 401, data: {} },
      };

      expect(() => capturedErrorHandler(error)).toThrow(GitlabError);
      try {
        capturedErrorHandler(error);
      } catch (err) {
        expect(err.message).toContain('authentication failed');
      }
    });

    it('should throw GitlabError on 403', () => {
      const error = {
        response: { status: 403, data: {} },
      };

      expect(() => capturedErrorHandler(error)).toThrow(GitlabError);
      try {
        capturedErrorHandler(error);
      } catch (err) {
        expect(err.message).toContain('access denied');
      }
    });

    it('should throw GitlabError on 404', () => {
      const error = {
        response: { status: 404, data: {} },
      };

      expect(() => capturedErrorHandler(error)).toThrow(GitlabError);
      try {
        capturedErrorHandler(error);
      } catch (err) {
        expect(err.message).toContain('not found');
      }
    });

    it('should throw GitlabError on 429', () => {
      const error = {
        response: { status: 429, data: {} },
      };

      expect(() => capturedErrorHandler(error)).toThrow(GitlabError);
      try {
        capturedErrorHandler(error);
      } catch (err) {
        expect(err.message).toContain('rate limit exceeded');
      }
    });

    it('should throw GitlabError on other HTTP status codes', () => {
      const error = {
        response: { status: 502, data: {} },
      };

      expect(() => capturedErrorHandler(error)).toThrow(GitlabError);
      try {
        capturedErrorHandler(error);
      } catch (err) {
        expect(err.message).toContain('502');
      }
    });

    it('should re-throw non-response errors (network errors)', () => {
      const error = new Error('Network error');
      error.code = 'ECONNREFUSED';

      expect(() => capturedErrorHandler(error)).toThrow('Network error');
    });
  });

  describe('get', () => {
    it('should make a GET request and return data', async () => {
      const mockData = { id: 1, title: 'Test MR' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await get('/projects/1/merge_requests/1', { view: 'simple' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/projects/1/merge_requests/1',
        { params: { view: 'simple' } },
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getAll', () => {
    it('should return single page results when only one page exists', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      mockAxiosInstance.get.mockResolvedValue({
        data: mockData,
        headers: { 'x-total-pages': '1' },
      });

      const result = await getAll('/projects/1/merge_requests', { state: 'opened' });

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });

    it('should paginate across multiple pages', async () => {
      const page1 = [{ id: 1 }, { id: 2 }];
      const page2 = [{ id: 3 }, { id: 4 }];

      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: page1,
          headers: { 'x-total-pages': '2', 'x-page': '1' },
        })
        .mockResolvedValueOnce({
          data: page2,
          headers: { 'x-total-pages': '2', 'x-page': '2' },
        });

      const result = await getAll('/projects/1/merge_requests');

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(
        1,
        '/projects/1/merge_requests',
        { params: { per_page: 100, page: 1 } },
      );
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(
        2,
        '/projects/1/merge_requests',
        { params: { per_page: 100, page: 2 } },
      );
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
    });

    it('should use custom per_page from params', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: [{ id: 1 }],
        headers: { 'x-total-pages': '1' },
      });

      await getAll('/projects/1/branches', { per_page: 50 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/projects/1/branches',
        { params: { per_page: 50, page: 1 } },
      );
    });

    it('should cap per_page at 100', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: [{ id: 1 }],
        headers: { 'x-total-pages': '1' },
      });

      await getAll('/projects/1/branches', { per_page: 999 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/projects/1/branches',
        { params: { per_page: 100, page: 1 } },
      );
    });

    it('should handle missing x-total-pages header', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: [{ id: 1 }],
        headers: {},
      });

      const result = await getAll('/projects/1/merge_requests');

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ id: 1 }]);
    });
  });
});
