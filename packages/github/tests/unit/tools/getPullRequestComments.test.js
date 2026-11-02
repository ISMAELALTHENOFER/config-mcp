import { describe, it, expect, jest } from '@jest/globals';

const mockGithubService = {
  getPullRequestComments: jest.fn(),
};

jest.unstable_mockModule('../../../src/github/githubService.js', () => mockGithubService);

const { handleGetPullRequestComments } =
  await import('../../../src/tools/getPullRequestComments.js');

describe('tools/getPullRequestComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call githubService.getPullRequestComments and return JSON text', async () => {
    const mockComments = [{ id: 1, kind: 'review', body: 'Nit', replies: [] }];
    mockGithubService.getPullRequestComments.mockResolvedValue(mockComments);

    const result = await handleGetPullRequestComments({
      repository: 'octo/project',
      pullNumber: 42,
    });

    expect(mockGithubService.getPullRequestComments).toHaveBeenCalledWith(
      'octo/project',
      42,
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockComments, null, 2) }],
    });
  });

  it('should reject missing repository or invalid pullNumber', async () => {
    await expect(handleGetPullRequestComments({ pullNumber: 1 })).rejects.toThrow();
    await expect(
      handleGetPullRequestComments({ repository: 'o/r', pullNumber: 'abc' }),
    ).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGithubService.getPullRequestComments.mockRejectedValue(new Error('API error'));

    await expect(
      handleGetPullRequestComments({ repository: 'o/r', pullNumber: 1 }),
    ).rejects.toThrow('API error');
  });
});
