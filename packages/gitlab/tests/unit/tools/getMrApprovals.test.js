import { describe, it, expect, jest } from '@jest/globals';

const mockGitlabService = {
  getMrApprovals: jest.fn(),
};

jest.unstable_mockModule('../../../src/gitlab/gitlabService.js', () => mockGitlabService);

const { handleGetMrApprovals } = await import('../../../src/tools/getMrApprovals.js');

describe('tools/getMrApprovals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call gitlabService.getMrApprovals and return MCP response', async () => {
    const mockApproval = { approved: true, approvers: [{ name: 'Jane' }], approvalsRequired: 1, approvalsLeft: 0 };
    mockGitlabService.getMrApprovals.mockResolvedValue(mockApproval);

    const result = await handleGetMrApprovals({ projectId: 'group/project', mrIid: 42 });

    expect(mockGitlabService.getMrApprovals).toHaveBeenCalledWith('group/project', 42);
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockApproval, null, 2) }],
    });
  });

  it('should return approval state with no approvers', async () => {
    const mockApproval = { approved: false, approvers: [], approvalsRequired: 2, approvalsLeft: 2 };
    mockGitlabService.getMrApprovals.mockResolvedValue(mockApproval);

    const result = await handleGetMrApprovals({ projectId: 'group/project', mrIid: 42 });

    expect(JSON.parse(result.content[0].text).approved).toBe(false);
    expect(JSON.parse(result.content[0].text).approvers).toEqual([]);
  });

  it('should reject missing projectId', async () => {
    await expect(handleGetMrApprovals({ mrIid: 42 })).rejects.toThrow();
  });

  it('should reject missing mrIid', async () => {
    await expect(handleGetMrApprovals({ projectId: 'g/p' })).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGitlabService.getMrApprovals.mockRejectedValue(new Error('Forbidden'));

    await expect(
      handleGetMrApprovals({ projectId: 'g/p', mrIid: 1 }),
    ).rejects.toThrow('Forbidden');
  });
});
