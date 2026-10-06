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
    GITHUB_API_URL: 'https://ghe.example.com/api/v3/',
    GITHUB_TOKEN: 'ghp_abc123',
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
  };
});

const { get, getRaw, getAll } = await import('../../../src/github/githubClient.js');
const { GithubError } = await import('../../../src/utils/errors.js');

describe('githubClient', () => {
  beforeEach(() => {
    // Reset only the per-request mocks, not the module-init mocks
    mockAxiosInstance.get.mockReset();
  });

  describe('axios instance creation', () => {
    it('should create an axios instance with base URL (no trailing slash) and GitHub headers', async () => {
      const axiosMod = await import('axios');
      const axiosDefault = axiosMod.default;

      expect(axiosDefault.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://ghe.example.com/api/v3',
          headers: expect.objectContaining({
            Authorization: 'Bearer ghp_abc123',
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          }),
        }),
      );
    });

    it('should register response interceptors', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('response interceptor', () => {
    const thrown = (error) => {
      try {
        capturedErrorHandler(error);
      } catch (err) {
        return err;
      }
      return undefined;
    };

    it('should throw GithubError on 401', () => {
      const err = thrown({ response: { status: 401, data: {} } });
      expect(err).toBeInstanceOf(GithubError);
      expect(err.message).toContain('authentication failed');
      expect(err.statusCode).toBe(401);
    });

    it('should throw GithubError on 403', () => {
      const err = thrown({ response: { status: 403, data: {}, headers: {} } });
      expect(err).toBeInstanceOf(GithubError);
      expect(err.message).toContain('access denied');
      expect(err.statusCode).toBe(403);
    });

    it('should map a 403 with exhausted quota to a rate limit error', () => {
      const err = thrown({
        response: { status: 403, data: {}, headers: { 'x-ratelimit-remaining': '0' } },
      });
      expect(err).toBeInstanceOf(GithubError);
      expect(err.message).toContain('rate limit exceeded');
      expect(err.statusCode).toBe(429);
    });

    it('should throw GithubError on 404', () => {
      const err = thrown({ response: { status: 404, data: {} } });
      expect(err).toBeInstanceOf(GithubError);
      expect(err.message).toContain('not found');
    });

    it('should throw GithubError on 429', () => {
      const err = thrown({ response: { status: 429, data: {} } });
      expect(err).toBeInstanceOf(GithubError);
      expect(err.message).toContain('rate limit exceeded');
    });

    it('should throw GithubError on other HTTP status codes', () => {
      const err = thrown({ response: { status: 502, data: {} } });
      expect(err).toBeInstanceOf(GithubError);
      expect(err.message).toContain('502');
    });

    it('should re-throw non-response errors (network errors)', () => {
      const error = new Error('Network error');
      error.code = 'ECONNREFUSED';

      expect(() => capturedErrorHandler(error)).toThrow('Network error');
    });
  });

  describe('get', () => {
    it('should make a GET request and return data', async () => {
      const mockData = { id: 1, title: 'Test PR' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await get('/repos/o/r/pulls/1', { foo: 'bar' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/o/r/pulls/1', {
        params: { foo: 'bar' },
      });
      expect(result).toEqual(mockData);
    });
  });

  it('requests raw file bytes with the raw media type rather than decoded text', async () => {
    const bytes = Buffer.from([0xff, 0x00]);
    mockAxiosInstance.get.mockResolvedValue({ data: bytes, headers: {} });
    expect((await getRaw('/repos/o/r/contents/a.bin', { ref: 'abc' })).data).toBe(bytes);
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/o/r/contents/a.bin', {
      params: { ref: 'abc' },
      responseType: 'arraybuffer',
      headers: { Accept: 'application/vnd.github.raw+json' },
    });
  });

  describe('getAll', () => {
    const link = (page, rel = 'next') =>
      `<https://api.github.com/repositories/1/pulls?per_page=100&page=${page}>; rel="${rel}"`;

    it('should return single page results when there is no next link', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      mockAxiosInstance.get.mockResolvedValue({ data: mockData, headers: {} });

      const result = await getAll('/repos/o/r/pulls', { state: 'open' });

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/o/r/pulls', {
        params: { state: 'open', per_page: 100, page: 1 },
      });
      expect(result).toEqual(mockData);
    });

    it('should follow rel="next" Link headers across pages', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: [{ id: 1 }, { id: 2 }],
          headers: { link: `${link(2)}, ${link(3, 'last')}` },
        })
        .mockResolvedValueOnce({
          data: [{ id: 3 }],
          headers: { link: `${link(1, 'prev')}, ${link(3)}, ${link(3, 'last')}` },
        })
        .mockResolvedValueOnce({
          data: [{ id: 4 }],
          headers: { link: `${link(2, 'prev')}, ${link(1, 'first')}` },
        });

      const result = await getAll('/repos/o/r/pulls');

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(1, '/repos/o/r/pulls', {
        params: { per_page: 100, page: 1 },
      });
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(2, '/repos/o/r/pulls', {
        params: { per_page: 100, page: '2' },
      });
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(3, '/repos/o/r/pulls', {
        params: { per_page: 100, page: '3' },
      });
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
    });

    it('should use custom per_page from params and cap it at 100', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [{ id: 1 }], headers: {} });

      await getAll('/repos/o/r/branches', { per_page: 50 });
      expect(mockAxiosInstance.get).toHaveBeenLastCalledWith('/repos/o/r/branches', {
        params: { per_page: 50, page: 1 },
      });

      await getAll('/repos/o/r/branches', { per_page: 999 });
      expect(mockAxiosInstance.get).toHaveBeenLastCalledWith('/repos/o/r/branches', {
        params: { per_page: 100, page: 1 },
      });
    });

    it('should stop when the next link carries no page number', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: [{ id: 1 }],
        headers: { link: '<https://api.github.com/x>; rel="next"' },
      });

      expect(await getAll('/repos/o/r/pulls')).toEqual([{ id: 1 }]);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should read items from a wrapper key when itemsKey is given', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: { total_count: 2, check_runs: [{ id: 1 }] },
          headers: { link: link(2) },
        })
        .mockResolvedValueOnce({
          data: { total_count: 2, check_runs: [{ id: 2 }] },
          headers: {},
        });

      expect(await getAll('/repos/o/r/commits/abc/check-runs', {}, 'check_runs')).toEqual(
        [{ id: 1 }, { id: 2 }],
      );
    });
  });
});
