import { describe, it, expect, jest } from '@jest/globals';

const mockGithubService = {
  getPullRequestReviews: jest.fn(),
};

jest.unstable_mockModule('../../../src/github/githubService.js', () => mockGithubService);

const { handleGetPullRequestReviews } =
  await import('../../../src/tools/getPullRequestReviews.js');

describe('tools/getPullRequestReviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call githubService.getPullRequestReviews and return JSON text', async () => {
    const mockApproval = { approved: true, approvers: [{ id: 1, login: 'jane' }] };
    mockGithubService.getPullRequestReviews.mockResolvedValue(mockApproval);

    const result = await handleGetPullRequestReviews({
      repository: 'octo/project',
      pullNumber: 42,
    });

    expect(mockGithubService.getPullRequestReviews).toHaveBeenCalledWith(
      'octo/project',
      42,
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockApproval, null, 2) }],
    });
  });

  it('should reject missing repository or invalid pullNumber', async () => {
    await expect(handleGetPullRequestReviews({ pullNumber: 1 })).rejects.toThrow();
    await expect(
      handleGetPullRequestReviews({ repository: 'o/r', pullNumber: 0 }),
    ).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGithubService.getPullRequestReviews.mockRejectedValue(new Error('API error'));

    await expect(
      handleGetPullRequestReviews({ repository: 'o/r', pullNumber: 1 }),
    ).rejects.toThrow('API error');
  });
});
