import { describe, it, expect, jest } from '@jest/globals';

const mockGithubService = {
  getPullRequestFiles: jest.fn(),
};

jest.unstable_mockModule('../../../src/github/githubService.js', () => mockGithubService);

const { handleGetPullRequestFiles } =
  await import('../../../src/tools/getPullRequestFiles.js');

describe('tools/getPullRequestFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call githubService.getPullRequestFiles and return JSON text', async () => {
    const mockFiles = {
      files: [{ filename: 'src/a.js', patchOmitted: false }],
      truncated: false,
    };
    mockGithubService.getPullRequestFiles.mockResolvedValue(mockFiles);

    const result = await handleGetPullRequestFiles({
      repository: 'octo/project',
      pullNumber: 42,
    });

    expect(mockGithubService.getPullRequestFiles).toHaveBeenCalledWith(
      'octo/project',
      42,
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockFiles, null, 2) }],
    });
  });

  it('should coerce a numeric string pullNumber', async () => {
    mockGithubService.getPullRequestFiles.mockResolvedValue({
      files: [],
      truncated: false,
    });

    await handleGetPullRequestFiles({ repository: 'o/r', pullNumber: '7' });

    expect(mockGithubService.getPullRequestFiles).toHaveBeenCalledWith('o/r', 7);
  });

  it('should reject missing repository or pullNumber', async () => {
    await expect(handleGetPullRequestFiles({ pullNumber: 1 })).rejects.toThrow();
    await expect(handleGetPullRequestFiles({ repository: 'o/r' })).rejects.toThrow();
  });

  it('should reject non-positive pullNumber', async () => {
    await expect(
      handleGetPullRequestFiles({ repository: 'o/r', pullNumber: -3 }),
    ).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGithubService.getPullRequestFiles.mockRejectedValue(new Error('API error'));

    await expect(
      handleGetPullRequestFiles({ repository: 'o/r', pullNumber: 1 }),
    ).rejects.toThrow('API error');
  });
});
