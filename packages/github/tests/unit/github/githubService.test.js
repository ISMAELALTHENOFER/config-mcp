import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mocks
const mockClient = {
  get: jest.fn(),
  getRaw: jest.fn(),
  getAll: jest.fn(),
};

jest.unstable_mockModule('../../../src/github/githubClient.js', () => mockClient);

jest.unstable_mockModule('../../../src/github/githubMapper.js', () => ({
  mapPullRequest: jest.fn(),
  mapPullFile: jest.fn(),
  mapPullComments: jest.fn(),
  mapApproval: jest.fn(),
  mapCheckRun: jest.fn(),
  mapPullListItem: jest.fn(),
  mapRepository: jest.fn(),
  mapBranch: jest.fn(),
  mapFileContent: jest.fn(),
}));

const mapper = await import('../../../src/github/githubMapper.js');
const service = await import('../../../src/github/githubService.js');
const { GithubError } = await import('../../../src/utils/errors.js');

// Fixtures
import pullRaw from '../../fixtures/pull.json' with { type: 'json' };
import pullFilesRaw from '../../fixtures/pullFiles.json' with { type: 'json' };
import issueCommentsRaw from '../../fixtures/issueComments.json' with { type: 'json' };
import reviewCommentsRaw from '../../fixtures/reviewComments.json' with { type: 'json' };
import reviewsRaw from '../../fixtures/reviews.json' with { type: 'json' };
import checkRunsRaw from '../../fixtures/checkRuns.json' with { type: 'json' };
import repoRaw from '../../fixtures/repo.json' with { type: 'json' };
import branchesRaw from '../../fixtures/branches.json' with { type: 'json' };

const REPO_PATH = '/repos/octo/project';

describe('githubService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getPullRequest', () => {
    it('should call client.get with the correct path and map the result', async () => {
      const mapped = { id: 12345, number: 42 };
      mockClient.get.mockResolvedValue(pullRaw);
      mapper.mapPullRequest.mockReturnValue(mapped);

      const result = await service.getPullRequest('octo/project', 42);

      expect(mockClient.get).toHaveBeenCalledWith(`${REPO_PATH}/pulls/42`);
      expect(mapper.mapPullRequest).toHaveBeenCalledWith(pullRaw);
      expect(result).toBe(mapped);
    });

    it('should accept a repository URL', async () => {
      mockClient.get.mockResolvedValue(pullRaw);

      await service.getPullRequest('https://github.com/octo/project', 42);

      expect(mockClient.get).toHaveBeenCalledWith(`${REPO_PATH}/pulls/42`);
    });

    it('should propagate GithubError from client.get', async () => {
      mockClient.get.mockRejectedValue(new GithubError('resource not found', 404));

      await expect(service.getPullRequest('octo/project', 999)).rejects.toThrow(
        GithubError,
      );
    });

    it('should wrap unknown errors as GithubError keeping the status code', async () => {
      const err = Object.assign(new Error('boom'), { statusCode: 503 });
      mockClient.get.mockRejectedValue(err);

      await expect(service.getPullRequest('octo/project', 1)).rejects.toMatchObject({
        name: 'GithubError',
        statusCode: 503,
      });

      mockClient.get.mockRejectedValue(new Error('plain'));
      await expect(service.getPullRequest('octo/project', 1)).rejects.toMatchObject({
        statusCode: 500,
      });
    });

    it('should reject an invalid repository without calling the API', async () => {
      await expect(service.getPullRequest('not-a-repo', 1)).rejects.toThrow(GithubError);
      expect(mockClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getPullRequestFiles', () => {
    it('should call client.getAll and map each file', async () => {
      mockClient.getAll.mockResolvedValue(pullFilesRaw);
      mapper.mapPullFile.mockImplementation((f) => ({ filename: f.filename }));

      const result = await service.getPullRequestFiles('octo/project', 42);

      expect(mockClient.getAll).toHaveBeenCalledWith(`${REPO_PATH}/pulls/42/files`);
      expect(mockClient.get).not.toHaveBeenCalled();
      expect(mapper.mapPullFile).toHaveBeenCalledTimes(4);
      expect(result).toEqual({
        files: pullFilesRaw.map((f) => ({ filename: f.filename })),
        truncated: false,
      });
    });

    it('should return an empty list when there are no files', async () => {
      mockClient.getAll.mockResolvedValue([]);

      expect(await service.getPullRequestFiles('octo/project', 42)).toEqual({
        files: [],
        truncated: false,
      });
    });

    it('should flag truncation when GitHub file listing cap is reached', async () => {
      mockClient.getAll.mockResolvedValue(
        Array.from({ length: 3000 }, () => pullFilesRaw[0]),
      );
      mapper.mapPullFile.mockReturnValue({});

      const result = await service.getPullRequestFiles('octo/project', 42);

      expect(result.files).toHaveLength(3000);
      expect(result.truncated).toBe(true);
    });
  });

  describe('getPullRequestComments', () => {
    it('should fetch issue and review comments and map them together', async () => {
      const mapped = [{ id: 8001 }, { id: 9001 }];
      mockClient.getAll.mockImplementation(async (path) =>
        path.endsWith('/issues/42/comments') ? issueCommentsRaw : reviewCommentsRaw,
      );
      mapper.mapPullComments.mockReturnValue(mapped);

      const result = await service.getPullRequestComments('octo/project', 42);

      expect(mockClient.getAll).toHaveBeenCalledWith(`${REPO_PATH}/issues/42/comments`);
      expect(mockClient.getAll).toHaveBeenCalledWith(`${REPO_PATH}/pulls/42/comments`);
      expect(mapper.mapPullComments).toHaveBeenCalledWith(
        issueCommentsRaw,
        reviewCommentsRaw,
      );
      expect(result).toBe(mapped);
    });
  });

  describe('getPullRequestReviews', () => {
    it('should call client.getAll and map the review state', async () => {
      const mapped = { approved: true, approvers: [] };
      mockClient.getAll.mockResolvedValue(reviewsRaw);
      mapper.mapApproval.mockReturnValue(mapped);

      const result = await service.getPullRequestReviews('octo/project', 42);

      expect(mockClient.getAll).toHaveBeenCalledWith(`${REPO_PATH}/pulls/42/reviews`);
      expect(mapper.mapApproval).toHaveBeenCalledWith(reviewsRaw);
      expect(result).toBe(mapped);
    });
  });

  describe('getPullRequestChecks', () => {
    it('should resolve the head SHA and map every check run', async () => {
      mockClient.get.mockResolvedValue(pullRaw);
      mockClient.getAll.mockResolvedValue(checkRunsRaw);
      mapper.mapCheckRun
        .mockReturnValueOnce({ id: 5001 })
        .mockReturnValueOnce({ id: 5002 });

      const result = await service.getPullRequestChecks('octo/project', 42);

      expect(mockClient.get).toHaveBeenCalledWith(`${REPO_PATH}/pulls/42`);
      expect(mockClient.getAll).toHaveBeenCalledWith(
        `${REPO_PATH}/commits/abc123def456/check-runs`,
        {},
        'check_runs',
      );
      expect(result).toEqual([{ id: 5001 }, { id: 5002 }]);
    });

    it('should return an empty array when there are no check runs', async () => {
      mockClient.get.mockResolvedValue(pullRaw);
      mockClient.getAll.mockResolvedValue([]);

      expect(await service.getPullRequestChecks('octo/project', 42)).toEqual([]);
    });

    it('should fail when the pull request exposes no head SHA', async () => {
      mockClient.get.mockResolvedValue({ ...pullRaw, head: {} });

      await expect(service.getPullRequestChecks('octo/project', 42)).rejects.toThrow(
        /head SHA/,
      );
      expect(mockClient.getAll).not.toHaveBeenCalled();
    });
  });

  describe('listPullRequests', () => {
    const merged = {
      ...pullRaw,
      number: 1,
      state: 'closed',
      merged_at: '2025-06-20T10:00:00Z',
    };
    const closedUnmerged = { ...pullRaw, number: 2, state: 'closed', merged_at: null };
    const open = { ...pullRaw, number: 3, labels: [{ name: 'bug' }, { name: 'ui' }] };

    it('should call client.getAll with API filters and map each item', async () => {
      mockClient.getAll.mockResolvedValue([open]);
      mapper.mapPullListItem.mockReturnValue({ number: 3 });

      const result = await service.listPullRequests('octo/project', {
        state: 'open',
        base: 'main',
        head: 'octo:feature/auth',
      });

      expect(mockClient.getAll).toHaveBeenCalledWith(`${REPO_PATH}/pulls`, {
        state: 'open',
        base: 'main',
        head: 'octo:feature/auth',
      });
      expect(result).toEqual([{ number: 3 }]);
    });

    it('should pass no filters when none provided', async () => {
      mockClient.getAll.mockResolvedValue([]);

      await service.listPullRequests('octo/project');

      expect(mockClient.getAll).toHaveBeenCalledWith(`${REPO_PATH}/pulls`, {});
    });

    it('should query closed PRs and keep only merged ones for state "merged"', async () => {
      mockClient.getAll.mockResolvedValue([merged, closedUnmerged]);
      mapper.mapPullListItem.mockImplementation((p) => ({ number: p.number }));

      const result = await service.listPullRequests('octo/project', { state: 'merged' });

      expect(mockClient.getAll).toHaveBeenCalledWith(`${REPO_PATH}/pulls`, {
        state: 'closed',
      });
      expect(result).toEqual([{ number: 1 }]);
    });

    it('should filter by labels (all must match, case-insensitive)', async () => {
      mockClient.getAll.mockResolvedValue([open, merged]);
      mapper.mapPullListItem.mockImplementation((p) => ({ number: p.number }));

      expect(
        await service.listPullRequests('octo/project', { labels: 'BUG, ui' }),
      ).toEqual([{ number: 3 }]);
      expect(mockClient.getAll).toHaveBeenCalledWith(`${REPO_PATH}/pulls`, {});
    });
  });

  describe('getRepository', () => {
    it('should call client.get and map the repository', async () => {
      const mapped = { id: 6789, name: 'project' };
      mockClient.get.mockResolvedValue(repoRaw);
      mapper.mapRepository.mockReturnValue(mapped);

      const result = await service.getRepository('octo/project');

      expect(mockClient.get).toHaveBeenCalledWith(REPO_PATH);
      expect(mapper.mapRepository).toHaveBeenCalledWith(repoRaw);
      expect(result).toBe(mapped);
    });
  });

  describe('listBranches', () => {
    it('should list all branches when no search is given', async () => {
      mockClient.getAll.mockResolvedValue(branchesRaw);
      mapper.mapBranch.mockImplementation((b) => ({ name: b.name }));

      const result = await service.listBranches('octo/project');

      expect(mockClient.getAll).toHaveBeenCalledWith(`${REPO_PATH}/branches`, {});
      expect(result).toHaveLength(3);
    });

    it('should filter branches by case-insensitive name substring', async () => {
      mockClient.getAll.mockResolvedValue(branchesRaw);
      mapper.mapBranch.mockImplementation((b) => ({ name: b.name }));

      const result = await service.listBranches('octo/project', 'HOTFIX');

      expect(mockClient.getAll).toHaveBeenCalledWith(`${REPO_PATH}/branches`, {});
      expect(result).toEqual([{ name: 'hotfix/login' }]);
    });
  });

  describe('getFileContent', () => {
    it('should call client.getRaw with the encoded path and ref, and map the result', async () => {
      const mockResponse = { data: 'const x = 1;\n', headers: {} };
      const mapped = { content: 'const x = 1;\n', fileName: 'src/index.js' };
      mockClient.getRaw.mockResolvedValue(mockResponse);
      mapper.mapFileContent.mockReturnValue(mapped);

      const result = await service.getFileContent('octo/project', 'src/index.js', 'main');

      expect(mockClient.getRaw).toHaveBeenCalledWith(
        `${REPO_PATH}/contents/src/index.js`,
        {
          ref: 'main',
        },
      );
      expect(mapper.mapFileContent).toHaveBeenCalledWith('const x = 1;\n', mockResponse);
      expect(result).toBe(mapped);
    });

    it('should encode each path segment and omit ref when not provided', async () => {
      mockClient.getRaw.mockResolvedValue({ data: '', headers: {} });
      mapper.mapFileContent.mockReturnValue({ content: '' });

      await service.getFileContent('octo/project', 'docs/my file#1.md');

      expect(mockClient.getRaw).toHaveBeenCalledWith(
        `${REPO_PATH}/contents/docs/my%20file%231.md`,
        {},
      );
    });
  });
});
