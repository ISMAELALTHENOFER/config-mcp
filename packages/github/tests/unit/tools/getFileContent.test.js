import { describe, it, expect, jest } from '@jest/globals';

const mockGithubService = {
  getFileContent: jest.fn(),
};

jest.unstable_mockModule('../../../src/github/githubService.js', () => mockGithubService);

const { handleGetFileContent } = await import('../../../src/tools/getFileContent.js');

describe('tools/getFileContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call githubService.getFileContent with repository, filePath, and ref', async () => {
    const mockFile = {
      content: 'const x = 1;',
      fileName: 'src/index.js',
      size: 12,
      encoding: 'utf-8',
      ref: 'main',
    };
    mockGithubService.getFileContent.mockResolvedValue(mockFile);

    const result = await handleGetFileContent({
      repository: 'octo/project',
      filePath: 'src/index.js',
      ref: 'main',
    });

    expect(mockGithubService.getFileContent).toHaveBeenCalledWith(
      'octo/project',
      'src/index.js',
      'main',
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockFile, null, 2) }],
    });
  });

  it('should call githubService.getFileContent without ref when not provided', async () => {
    mockGithubService.getFileContent.mockResolvedValue({ content: '' });

    await handleGetFileContent({ repository: 'octo/project', filePath: 'README.md' });

    expect(mockGithubService.getFileContent).toHaveBeenCalledWith(
      'octo/project',
      'README.md',
      undefined,
    );
  });

  it('should reject missing repository', async () => {
    await expect(handleGetFileContent({ filePath: 'f.js' })).rejects.toThrow();
  });

  it('should reject missing filePath', async () => {
    await expect(handleGetFileContent({ repository: 'o/r' })).rejects.toThrow();
  });

  it('should reject path traversal in filePath', async () => {
    await expect(
      handleGetFileContent({ repository: 'o/r', filePath: '../etc/passwd' }),
    ).rejects.toThrow(/traversal|invalid|not allowed/i);
  });

  it('should reject path traversal with nested and backslash sequences', async () => {
    await expect(
      handleGetFileContent({ repository: 'o/r', filePath: 'subdir/../../../etc/hosts' }),
    ).rejects.toThrow(/traversal|invalid|not allowed/i);
    await expect(
      handleGetFileContent({ repository: 'o/r', filePath: 'subdir\\..\\secret' }),
    ).rejects.toThrow(/traversal|invalid|not allowed/i);
  });

  it('should propagate service errors', async () => {
    mockGithubService.getFileContent.mockRejectedValue(new Error('File not found'));

    await expect(
      handleGetFileContent({ repository: 'o/r', filePath: 'missing.js' }),
    ).rejects.toThrow('File not found');
  });
});
