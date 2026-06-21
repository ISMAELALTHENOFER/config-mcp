import { describe, it, expect, jest } from '@jest/globals';

const mockGitlabService = {
  getMr: jest.fn(),
};

jest.unstable_mockModule('../../../src/gitlab/gitlabService.js', () => mockGitlabService);

const { ValidationError } = await import('../../../src/utils/errors.js');
const { handleGetMr } = await import('../../../src/tools/getMr.js');

describe('tools/getMr', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call gitlabService.getMr with parsed URL', async () => {
    const mockResult = { iid: 42, title: 'Test MR' };
    mockGitlabService.getMr.mockResolvedValue(mockResult);

    const result = await handleGetMr({
      url: 'https://gitlab.com/group/project/-/merge_requests/42',
    });

    expect(mockGitlabService.getMr).toHaveBeenCalledWith('group/project', 42);
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
    });
  });

  it('should call gitlabService.getMr with direct projectId + mrIid', async () => {
    const mockResult = { iid: 99, title: 'Direct MR' };
    mockGitlabService.getMr.mockResolvedValue(mockResult);

    const result = await handleGetMr({ projectId: 'other/group/proj', mrIid: 99 });

    expect(mockGitlabService.getMr).toHaveBeenCalledWith('other/group/proj', 99);
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
    });
  });

  it('should reject missing both url and projectId+mrIid', async () => {
    await expect(handleGetMr({})).rejects.toThrow();
  });

  it('should reject non-positive mrIid', async () => {
    await expect(handleGetMr({ projectId: 'g/p', mrIid: 0 })).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGitlabService.getMr.mockRejectedValue(new Error('Not found'));

    await expect(
      handleGetMr({ url: 'https://gitlab.com/group/project/-/merge_requests/1' }),
    ).rejects.toThrow('Not found');
  });

  it('should reject invalid URL format', async () => {
    await expect(
      handleGetMr({ url: 'not-a-url' }),
    ).rejects.toThrow();
  });
});
