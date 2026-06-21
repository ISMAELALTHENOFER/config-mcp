import { describe, it, expect, jest } from '@jest/globals';

const mockGitlabService = {
  getProject: jest.fn(),
};

jest.unstable_mockModule('../../../src/gitlab/gitlabService.js', () => mockGitlabService);

const { handleGetProject } = await import('../../../src/tools/getProject.js');

describe('tools/getProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call gitlabService.getProject and return MCP response', async () => {
    const mockProject = {
      id: 6789,
      name: 'project',
      nameWithNamespace: 'group / project',
      webUrl: 'https://gitlab.example.com/group/project',
    };
    mockGitlabService.getProject.mockResolvedValue(mockProject);

    const result = await handleGetProject({ projectPath: 'group/project' });

    expect(mockGitlabService.getProject).toHaveBeenCalledWith('group/project');
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockProject, null, 2) }],
    });
  });

  it('should reject missing projectPath', async () => {
    await expect(handleGetProject({})).rejects.toThrow();
  });

  it('should reject empty projectPath', async () => {
    await expect(handleGetProject({ projectPath: '' })).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGitlabService.getProject.mockRejectedValue(new Error('Not found'));

    await expect(handleGetProject({ projectPath: 'nonexistent' })).rejects.toThrow('Not found');
  });
});
