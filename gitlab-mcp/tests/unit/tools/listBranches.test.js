import { describe, it, expect, jest } from '@jest/globals';

const mockGitlabService = {
  listBranches: jest.fn(),
};

jest.unstable_mockModule('../../../src/gitlab/gitlabService.js', () => mockGitlabService);

const { handleListBranches } = await import('../../../src/tools/listBranches.js');

describe('tools/listBranches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call gitlabService.listBranches with projectId only', async () => {
    mockGitlabService.listBranches.mockResolvedValue([]);

    await handleListBranches({ projectId: 'group/project' });

    expect(mockGitlabService.listBranches).toHaveBeenCalledWith('group/project', undefined);
  });

  it('should pass search parameter when provided', async () => {
    const mockBranches = [{ name: 'feature/auth', default: false }];
    mockGitlabService.listBranches.mockResolvedValue(mockBranches);

    const result = await handleListBranches({ projectId: 'group/project', search: 'feature/' });

    expect(mockGitlabService.listBranches).toHaveBeenCalledWith('group/project', 'feature/');
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockBranches, null, 2) }],
    });
  });

  it('should reject missing projectId', async () => {
    await expect(handleListBranches({})).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGitlabService.listBranches.mockRejectedValue(new Error('Not found'));

    await expect(handleListBranches({ projectId: 'g/p' })).rejects.toThrow('Not found');
  });
});
