import { describe, it, expect, jest } from '@jest/globals';

const mockGitlabService = {
  getMrPipelines: jest.fn(),
};

jest.unstable_mockModule('../../../src/gitlab/gitlabService.js', () => mockGitlabService);

const { handleGetMrPipelines } = await import('../../../src/tools/getMrPipelines.js');

describe('tools/getMrPipelines', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call gitlabService.getMrPipelines and return MCP response', async () => {
    const mockPipelines = [
      { id: 5001, status: 'success', ref: 'feature/auth' },
      { id: 5002, status: 'running', ref: 'feature/auth' },
    ];
    mockGitlabService.getMrPipelines.mockResolvedValue(mockPipelines);

    const result = await handleGetMrPipelines({ projectId: 'group/project', mrIid: 42 });

    expect(mockGitlabService.getMrPipelines).toHaveBeenCalledWith('group/project', 42);
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockPipelines, null, 2) }],
    });
  });

  it('should return empty array when no pipelines', async () => {
    mockGitlabService.getMrPipelines.mockResolvedValue([]);

    const result = await handleGetMrPipelines({ projectId: 'group/project', mrIid: 42 });

    expect(JSON.parse(result.content[0].text)).toEqual([]);
  });

  it('should reject missing projectId', async () => {
    await expect(handleGetMrPipelines({ mrIid: 42 })).rejects.toThrow();
  });

  it('should reject missing mrIid', async () => {
    await expect(handleGetMrPipelines({ projectId: 'g/p' })).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGitlabService.getMrPipelines.mockRejectedValue(new Error('Rate limited'));

    await expect(
      handleGetMrPipelines({ projectId: 'g/p', mrIid: 1 }),
    ).rejects.toThrow('Rate limited');
  });
});
