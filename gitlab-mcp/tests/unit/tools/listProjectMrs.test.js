import { describe, it, expect, jest } from '@jest/globals';

const mockGitlabService = {
  listProjectMrs: jest.fn(),
};

jest.unstable_mockModule('../../../src/gitlab/gitlabService.js', () => mockGitlabService);

const { handleListProjectMrs } = await import('../../../src/tools/listProjectMrs.js');

describe('tools/listProjectMrs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call gitlabService.listProjectMrs with projectId only', async () => {
    mockGitlabService.listProjectMrs.mockResolvedValue([]);

    await handleListProjectMrs({ projectId: 'group/project' });

    expect(mockGitlabService.listProjectMrs).toHaveBeenCalledWith('group/project', {});
  });

  it('should pass state filter', async () => {
    mockGitlabService.listProjectMrs.mockResolvedValue([]);

    await handleListProjectMrs({ projectId: 'group/project', state: 'merged' });

    expect(mockGitlabService.listProjectMrs).toHaveBeenCalledWith(
      'group/project',
      { state: 'merged' },
    );
  });

  it('should pass labels and search filters', async () => {
    const mockMrs = [{ iid: 1, title: 'Bug fix' }];
    mockGitlabService.listProjectMrs.mockResolvedValue(mockMrs);

    const result = await handleListProjectMrs({
      projectId: 'group/project',
      labels: 'bug,urgent',
      search: 'fix',
    });

    expect(mockGitlabService.listProjectMrs).toHaveBeenCalledWith(
      'group/project',
      { labels: 'bug,urgent', search: 'fix' },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockMrs, null, 2) }],
    });
  });

  it('should reject missing projectId', async () => {
    await expect(handleListProjectMrs({})).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGitlabService.listProjectMrs.mockRejectedValue(new Error('Not found'));

    await expect(
      handleListProjectMrs({ projectId: 'g/p' }),
    ).rejects.toThrow('Not found');
  });
});
