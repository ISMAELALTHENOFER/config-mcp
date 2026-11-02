import { describe, it, expect, jest } from '@jest/globals';

const mockGithubService = {
  getPullRequestChecks: jest.fn(),
};

jest.unstable_mockModule('../../../src/github/githubService.js', () => mockGithubService);

const { handleGetPullRequestChecks } =
  await import('../../../src/tools/getPullRequestChecks.js');

describe('tools/getPullRequestChecks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call githubService.getPullRequestChecks and return JSON text', async () => {
    const mockChecks = [{ id: 5001, name: 'build', conclusion: 'success' }];
    mockGithubService.getPullRequestChecks.mockResolvedValue(mockChecks);

    const result = await handleGetPullRequestChecks({
      repository: 'octo/project',
      pullNumber: 42,
    });

    expect(mockGithubService.getPullRequestChecks).toHaveBeenCalledWith(
      'octo/project',
      42,
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockChecks, null, 2) }],
    });
  });

  it('should reject missing repository or invalid pullNumber', async () => {
    await expect(handleGetPullRequestChecks({ pullNumber: 1 })).rejects.toThrow();
    await expect(
      handleGetPullRequestChecks({ repository: 'o/r', pullNumber: 1.5 }),
    ).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGithubService.getPullRequestChecks.mockRejectedValue(new Error('API error'));

    await expect(
      handleGetPullRequestChecks({ repository: 'o/r', pullNumber: 1 }),
    ).rejects.toThrow('API error');
  });
});
