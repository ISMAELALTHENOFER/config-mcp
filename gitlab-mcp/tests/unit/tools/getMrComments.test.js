import { describe, it, expect, jest } from '@jest/globals';

const mockGitlabService = {
  getMrComments: jest.fn(),
};

jest.unstable_mockModule('../../../src/gitlab/gitlabService.js', () => mockGitlabService);

const { handleGetMrComments } = await import('../../../src/tools/getMrComments.js');

describe('tools/getMrComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call gitlabService.getMrComments and return MCP response', async () => {
    const mockComments = [
      { id: 'disc1', body: 'Great work!', replies: [] },
    ];
    mockGitlabService.getMrComments.mockResolvedValue(mockComments);

    const result = await handleGetMrComments({ projectId: 'group/project', mrIid: 42 });

    expect(mockGitlabService.getMrComments).toHaveBeenCalledWith('group/project', 42);
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockComments, null, 2) }],
    });
  });

  it('should return empty array when no comments', async () => {
    mockGitlabService.getMrComments.mockResolvedValue([]);

    const result = await handleGetMrComments({ projectId: 'group/project', mrIid: 42 });

    expect(JSON.parse(result.content[0].text)).toEqual([]);
  });

  it('should reject missing projectId', async () => {
    await expect(handleGetMrComments({ mrIid: 42 })).rejects.toThrow();
  });

  it('should reject missing mrIid', async () => {
    await expect(handleGetMrComments({ projectId: 'g/p' })).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGitlabService.getMrComments.mockRejectedValue(new Error('API error'));

    await expect(
      handleGetMrComments({ projectId: 'g/p', mrIid: 1 }),
    ).rejects.toThrow('API error');
  });
});
