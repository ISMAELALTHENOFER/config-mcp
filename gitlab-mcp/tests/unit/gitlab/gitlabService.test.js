import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mocks
const mockClient = {
  get: jest.fn(),
  getRaw: jest.fn(),
  getAll: jest.fn(),
};

jest.unstable_mockModule('../../../src/gitlab/gitlabClient.js', () => mockClient);

jest.unstable_mockModule('../../../src/gitlab/gitlabMapper.js', () => ({
  mapMr: jest.fn(),
  mapMrDiff: jest.fn(),
  mapMrComment: jest.fn(),
  mapMrApproval: jest.fn(),
  mapMrPipeline: jest.fn(),
  mapMrListItem: jest.fn(),
  mapProject: jest.fn(),
  mapBranch: jest.fn(),
  mapFileContent: jest.fn(),
}));

const mapper = await import('../../../src/gitlab/gitlabMapper.js');
const service = await import('../../../src/gitlab/gitlabService.js');
const { GitlabError } = await import('../../../src/utils/errors.js');

// Fixtures
import mrRaw from '../../fixtures/mr.json' with { type: 'json' };
import mrDiffsRaw from '../../fixtures/mrDiffs.json' with { type: 'json' };
import mrCommentsRaw from '../../fixtures/mrComments.json' with { type: 'json' };
import mrApprovalsRaw from '../../fixtures/mrApprovals.json' with { type: 'json' };
import mrPipelinesRaw from '../../fixtures/mrPipelines.json' with { type: 'json' };
import projectRaw from '../../fixtures/project.json' with { type: 'json' };
import branchesRaw from '../../fixtures/branches.json' with { type: 'json' };

const ENCODED_PATH = 'group%2Fproject';

describe('gitlabService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMr', () => {
    it('should call client.get with the correct path and map the result', async () => {
      const mapped = { id: 12345, iid: 42, title: 'Test' };
      mockClient.get.mockResolvedValue(mrRaw);
      mapper.mapMr.mockReturnValue(mapped);

      const result = await service.getMr('group/project', 42);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/merge_requests/42`,
      );
      expect(mapper.mapMr).toHaveBeenCalledWith(mrRaw);
      expect(result).toBe(mapped);
    });

    it('should propagate errors from client.get', async () => {
      const gitlabErr = new GitlabError('resource not found', 404);
      mockClient.get.mockRejectedValue(gitlabErr);

      await expect(service.getMr('group/project', 999))
        .rejects.toThrow(GitlabError);
    });
  });

  describe('getMrDiffs', () => {
    it('should call client.get and map each diff', async () => {
      const mappedDiffs = [{ oldPath: 'file.js', diff: '...' }];
      mockClient.get.mockResolvedValue(mrDiffsRaw);
      mapper.mapMrDiff
        .mockReturnValueOnce(mappedDiffs[0])
        .mockReturnValueOnce({ oldPath: 'new.js' })
        .mockReturnValueOnce({ oldPath: 'del.js' });

      const result = await service.getMrDiffs('group/project', 42);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/merge_requests/42/diffs`,
      );
      expect(mapper.mapMrDiff).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when there are no diffs', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await service.getMrDiffs('group/project', 42);

      expect(result).toEqual([]);
    });
  });

  describe('getMrComments', () => {
    it('should call client.get and map each discussion', async () => {
      const mappedComments = [
        { id: 'disc1', body: 'Comment 1', replies: [] },
        { id: 'disc2', body: 'Comment 2', replies: [] },
      ];
      mockClient.get.mockResolvedValue(mrCommentsRaw);
      mapper.mapMrComment
        .mockReturnValueOnce(mappedComments[0])
        .mockReturnValueOnce(mappedComments[1]);

      const result = await service.getMrComments('group/project', 42);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/merge_requests/42/discussions`,
      );
      expect(mapper.mapMrComment).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].body).toBe('Comment 1');
    });

    it('should return empty array when there are no discussions', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await service.getMrComments('group/project', 42);

      expect(result).toEqual([]);
    });
  });

  describe('getMrApprovals', () => {
    it('should call client.get and map the approval state', async () => {
      const mapped = { approved: true, approvers: [] };
      mockClient.get.mockResolvedValue(mrApprovalsRaw);
      mapper.mapMrApproval.mockReturnValue(mapped);

      const result = await service.getMrApprovals('group/project', 42);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/merge_requests/42/approvals`,
      );
      expect(mapper.mapMrApproval).toHaveBeenCalledWith(mrApprovalsRaw);
      expect(result).toBe(mapped);
    });
  });

  describe('getMrPipelines', () => {
    it('should call client.get and map each pipeline', async () => {
      const mappedPipelines = [
        { id: 5001, status: 'success' },
        { id: 5002, status: 'failed' },
      ];
      mockClient.get.mockResolvedValue(mrPipelinesRaw);
      mapper.mapMrPipeline
        .mockReturnValueOnce(mappedPipelines[0])
        .mockReturnValueOnce(mappedPipelines[1]);

      const result = await service.getMrPipelines('group/project', 42);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/merge_requests/42/pipelines`,
      );
      expect(mapper.mapMrPipeline).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when there are no pipelines', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await service.getMrPipelines('group/project', 42);

      expect(result).toEqual([]);
    });
  });

  describe('listProjectMrs', () => {
    it('should call client.getAll with filters and map each item', async () => {
      const mappedItems = [{ iid: 42, title: 'Test MR' }];
      mockClient.getAll.mockResolvedValue([mrRaw]);
      mapper.mapMrListItem.mockReturnValue(mappedItems[0]);

      const result = await service.listProjectMrs('group/project', { state: 'opened' });

      expect(mockClient.getAll).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/merge_requests`,
        { state: 'opened' },
      );
      expect(result).toEqual(mappedItems);
    });

    it('should pass no filters when none provided', async () => {
      mockClient.getAll.mockResolvedValue([]);

      await service.listProjectMrs('group/project');

      expect(mockClient.getAll).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/merge_requests`,
        {},
      );
    });
  });

  describe('getProject', () => {
    it('should call client.get and map the project', async () => {
      const mapped = { id: 6789, name: 'project' };
      mockClient.get.mockResolvedValue(projectRaw);
      mapper.mapProject.mockReturnValue(mapped);

      const result = await service.getProject('group/project');

      expect(mockClient.get).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}`,
      );
      expect(mapper.mapProject).toHaveBeenCalledWith(projectRaw);
      expect(result).toBe(mapped);
    });
  });

  describe('listBranches', () => {
    it('should call client.getAll with search param and map each branch', async () => {
      const mappedBranches = [{ name: 'main', default: true }];
      mockClient.getAll.mockResolvedValue([branchesRaw[0]]);
      mapper.mapBranch.mockReturnValue(mappedBranches[0]);

      const result = await service.listBranches('group/project', 'main');

      expect(mockClient.getAll).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/repository/branches`,
        { search: 'main' },
      );
      expect(result).toEqual(mappedBranches);
    });

    it('should call client.getAll without search when not provided', async () => {
      mockClient.getAll.mockResolvedValue([]);

      await service.listBranches('group/project');

      expect(mockClient.getAll).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/repository/branches`,
        {},
      );
    });
  });

  describe('getFileContent', () => {
    it('should call client.getRaw with correct path and ref, and map the result', async () => {
      const fileContent = 'const x = 1;\n';
      const mockResponse = {
        data: fileContent,
        headers: { 'content-length': '12', 'content-type': 'text/plain' },
      };
      const mapped = {
        content: fileContent,
        fileName: 'src/index.js',
        size: 12,
        encoding: 'base64',
        ref: 'main',
      };

      // getFileContent uses getRaw to preserve response headers for mapping
      mockClient.getRaw.mockResolvedValue(mockResponse);
      mapper.mapFileContent.mockReturnValue(mapped);

      const result = await service.getFileContent('group/project', 'src/index.js', 'main');

      expect(mockClient.getRaw).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/repository/files/src%2Findex.js/raw`,
        { ref: 'main' },
      );
      expect(mapper.mapFileContent).toHaveBeenCalledWith(fileContent, mockResponse);
      expect(result).toBe(mapped);
    });

    it('should omit ref param when not provided', async () => {
      const mockResponse = { data: '', headers: {} };
      mockClient.getRaw.mockResolvedValue(mockResponse);
      mapper.mapFileContent.mockReturnValue({ content: '' });

      await service.getFileContent('group/project', 'README.md');

      expect(mockClient.getRaw).toHaveBeenCalledWith(
        `/projects/${ENCODED_PATH}/repository/files/README.md/raw`,
        {},
      );
    });
  });
});
