import { describe, it, expect, jest } from '@jest/globals';

const mockGitlabService = {
  getMrDiffs: jest.fn(),
};

jest.unstable_mockModule('../../../src/gitlab/gitlabService.js', () => mockGitlabService);

const { handleGetMrDiffs } = await import('../../../src/tools/getMrDiffs.js');

describe('tools/getMrDiffs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call gitlabService.getMrDiffs and return MCP response', async () => {
    const mockDiffs = [
      { oldPath: 'src/index.js', newPath: 'src/index.js', diff: '...' },
    ];
    mockGitlabService.getMrDiffs.mockResolvedValue(mockDiffs);

    const result = await handleGetMrDiffs({ projectId: 'group/project', mrIid: 42 });

    expect(mockGitlabService.getMrDiffs).toHaveBeenCalledWith('group/project', 42);
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockDiffs, null, 2) }],
    });
  });

  it('should return empty array when no diffs', async () => {
    mockGitlabService.getMrDiffs.mockResolvedValue([]);

    const result = await handleGetMrDiffs({ projectId: 'group/project', mrIid: 42 });

    expect(result.content[0].text).toContain('[]');
  });

  it('should reject missing projectId', async () => {
    await expect(handleGetMrDiffs({ mrIid: 42 })).rejects.toThrow();
  });

  it('should reject missing mrIid', async () => {
    await expect(handleGetMrDiffs({ projectId: 'g/p' })).rejects.toThrow();
  });

  it('should reject non-positive mrIid', async () => {
    await expect(handleGetMrDiffs({ projectId: 'g/p', mrIid: -1 })).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGitlabService.getMrDiffs.mockRejectedValue(new Error('Not found'));

    await expect(
      handleGetMrDiffs({ projectId: 'g/p', mrIid: 999 }),
    ).rejects.toThrow('Not found');
  });
});
