import { describe, it, expect, jest } from '@jest/globals';

const mockGithubService = {
  getPullRequest: jest.fn(),
};

jest.unstable_mockModule('../../../src/github/githubService.js', () => mockGithubService);

const { handleGetPullRequest } = await import('../../../src/tools/getPullRequest.js');

describe('tools/getPullRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call githubService.getPullRequest with parsed URL', async () => {
    const mockResult = { number: 42, title: 'Test PR' };
    mockGithubService.getPullRequest.mockResolvedValue(mockResult);

    const result = await handleGetPullRequest({
      url: 'https://github.com/octo/project/pull/42',
    });

    expect(mockGithubService.getPullRequest).toHaveBeenCalledWith('octo/project', 42);
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
    });
  });

  it('should call githubService.getPullRequest with direct repository + pullNumber', async () => {
    const mockResult = { number: 99, title: 'Direct PR' };
    mockGithubService.getPullRequest.mockResolvedValue(mockResult);

    const result = await handleGetPullRequest({
      repository: 'other/proj',
      pullNumber: '99',
    });

    expect(mockGithubService.getPullRequest).toHaveBeenCalledWith('other/proj', 99);
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
    });
  });

  it('should reject missing both url and repository+pullNumber', async () => {
    await expect(handleGetPullRequest({})).rejects.toThrow();
    await expect(handleGetPullRequest({ repository: 'o/r' })).rejects.toThrow();
  });

  it('should reject non-positive pullNumber', async () => {
    await expect(
      handleGetPullRequest({ repository: 'o/r', pullNumber: 0 }),
    ).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGithubService.getPullRequest.mockRejectedValue(new Error('Not found'));

    await expect(
      handleGetPullRequest({ url: 'https://github.com/octo/project/pull/1' }),
    ).rejects.toThrow('Not found');
  });

  it('should reject invalid URL and non-PR URLs', async () => {
    await expect(handleGetPullRequest({ url: 'not-a-url' })).rejects.toThrow();
    await expect(
      handleGetPullRequest({ url: 'https://github.com/octo/project/issues/1' }),
    ).rejects.toThrow('not a pull request');
  });
});
