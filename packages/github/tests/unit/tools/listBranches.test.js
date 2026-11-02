import { describe, it, expect, jest } from '@jest/globals';

const mockGithubService = {
  listBranches: jest.fn(),
};

jest.unstable_mockModule('../../../src/github/githubService.js', () => mockGithubService);

const { handleListBranches } = await import('../../../src/tools/listBranches.js');

describe('tools/listBranches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call githubService.listBranches with repository and search', async () => {
    const mockBranches = [{ name: 'main', protected: true }];
    mockGithubService.listBranches.mockResolvedValue(mockBranches);

    const result = await handleListBranches({
      repository: 'octo/project',
      search: 'main',
    });

    expect(mockGithubService.listBranches).toHaveBeenCalledWith('octo/project', 'main');
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockBranches, null, 2) }],
    });
  });

  it('should call githubService.listBranches without search when not provided', async () => {
    mockGithubService.listBranches.mockResolvedValue([]);

    await handleListBranches({ repository: 'octo/project' });

    expect(mockGithubService.listBranches).toHaveBeenCalledWith(
      'octo/project',
      undefined,
    );
  });

  it('should reject missing repository', async () => {
    await expect(handleListBranches({})).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGithubService.listBranches.mockRejectedValue(new Error('API error'));

    await expect(handleListBranches({ repository: 'o/r' })).rejects.toThrow('API error');
  });
});
