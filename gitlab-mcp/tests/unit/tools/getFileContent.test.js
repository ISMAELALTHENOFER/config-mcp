import { describe, it, expect, jest } from '@jest/globals';

const mockGitlabService = {
  getFileContent: jest.fn(),
};

jest.unstable_mockModule('../../../src/gitlab/gitlabService.js', () => mockGitlabService);

const { handleGetFileContent } = await import('../../../src/tools/getFileContent.js');

describe('tools/getFileContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call gitlabService.getFileContent with projectId, filePath, and ref', async () => {
    const mockFile = { content: 'const x = 1;', fileName: 'src/index.js', size: 12, encoding: 'base64', ref: 'main' };
    mockGitlabService.getFileContent.mockResolvedValue(mockFile);

    const result = await handleGetFileContent({
      projectId: 'group/project',
      filePath: 'src/index.js',
      ref: 'main',
    });

    expect(mockGitlabService.getFileContent).toHaveBeenCalledWith('group/project', 'src/index.js', 'main');
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockFile, null, 2) }],
    });
  });

  it('should call gitlabService.getFileContent without ref when not provided', async () => {
    mockGitlabService.getFileContent.mockResolvedValue({ content: '' });

    await handleGetFileContent({ projectId: 'group/project', filePath: 'README.md' });

    expect(mockGitlabService.getFileContent).toHaveBeenCalledWith('group/project', 'README.md', undefined);
  });

  it('should reject missing projectId', async () => {
    await expect(handleGetFileContent({ filePath: 'f.js' })).rejects.toThrow();
  });

  it('should reject missing filePath', async () => {
    await expect(handleGetFileContent({ projectId: 'g/p' })).rejects.toThrow();
  });

  it('should reject path traversal in filePath', async () => {
    await expect(
      handleGetFileContent({ projectId: 'g/p', filePath: '../etc/passwd' }),
    ).rejects.toThrow(/traversal|invalid|not allowed/i);
  });

  it('should reject path traversal with encoded sequences', async () => {
    await expect(
      handleGetFileContent({ projectId: 'g/p', filePath: 'subdir/../../../etc/hosts' }),
    ).rejects.toThrow(/traversal|invalid|not allowed/i);
  });

  it('should propagate service errors', async () => {
    mockGitlabService.getFileContent.mockRejectedValue(new Error('File not found'));

    await expect(
      handleGetFileContent({ projectId: 'g/p', filePath: 'missing.js' }),
    ).rejects.toThrow('File not found');
  });
});
