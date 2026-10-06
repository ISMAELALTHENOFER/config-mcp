import { describe, it, expect, jest } from '@jest/globals';

const mockGithubService = {
  getRepository: jest.fn(),
};

jest.unstable_mockModule('../../../src/github/githubService.js', () => mockGithubService);

const { handleGetRepository } = await import('../../../src/tools/getRepository.js');

describe('tools/getRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call githubService.getRepository and return JSON text', async () => {
    const mockRepo = { id: 6789, name: 'project' };
    mockGithubService.getRepository.mockResolvedValue(mockRepo);

    const result = await handleGetRepository({ repository: 'octo/project' });

    expect(mockGithubService.getRepository).toHaveBeenCalledWith('octo/project');
    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify(mockRepo, null, 2) }],
    });
  });

  it('should reject missing or empty repository', async () => {
    await expect(handleGetRepository({})).rejects.toThrow();
    await expect(handleGetRepository({ repository: '' })).rejects.toThrow();
  });

  it('should propagate service errors', async () => {
    mockGithubService.getRepository.mockRejectedValue(new Error('Not found'));

    await expect(handleGetRepository({ repository: 'o/r' })).rejects.toThrow('Not found');
  });
});
