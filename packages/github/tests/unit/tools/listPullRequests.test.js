import { describe, it, expect, jest } from '@jest/globals';

const mockGithubService = {
  listPullRequests: jest.fn(),
};

jest.unstable_mockModule('../../../src/github/githubService.js', () => mockGithubService);

const { handleListPullRequests } = await import('../../../src/tools/listPullRequests.js');

describe('tools/listPullRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call githubService.listPullRequests with all filters', async () => {
    const mockPulls = [{ number: 42, title: 'Test PR' }];
    mockGithubService.listPullRequests.mockResolvedValue(mockPulls);

    const result = await handleListPullRequests({
      repository: 'octo/project',
      state: 'merged',
      base: 'main',
      head: 'octo:feature',
      labels: 'bug,ui',
    });

    expect(mockGithubService.listPullRequests).toHaveBeenCalledWith('octo/project', {
      state: 'merged',
      base: 'main',
      head: 'octo:feature',
      labels: 'bug,ui',
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockPulls, null, 2) }],
    });
  });

  it('should pass an empty filter object when only repository is given', async () => {
    mockGithubService.listPullRequests.mockResolvedValue([]);

    await handleListPullRequests({ repository: 'octo/project' });

    expect(mockGithubService.listPullRequests).toHaveBeenCalledWith('octo/project', {});
  });

  it('should reject missing repository', async () => {
    await expect(handleListPullRequests({})).rejects.toThrow();
  });

  it('should reject invalid state', async () => {
    await expect(
      handleListPullRequests({ repository: 'o/r', state: 'opened' }),
    ).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGithubService.listPullRequests.mockRejectedValue(new Error('API error'));

    await expect(handleListPullRequests({ repository: 'o/r' })).rejects.toThrow(
      'API error',
    );
  });
});
