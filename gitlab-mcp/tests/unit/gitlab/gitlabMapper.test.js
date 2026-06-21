import { describe, it, expect } from '@jest/globals';
import {
  mapMr,
  mapMrDiff,
  mapMrComment,
  mapMrApproval,
  mapMrPipeline,
  mapMrListItem,
  mapProject,
  mapBranch,
  mapFileContent,
} from '../../../src/gitlab/gitlabMapper.js';

import mrRaw from '../../fixtures/mr.json' with { type: 'json' };
import mrDiffsRaw from '../../fixtures/mrDiffs.json' with { type: 'json' };
import mrCommentsRaw from '../../fixtures/mrComments.json' with { type: 'json' };
import mrApprovalsRaw from '../../fixtures/mrApprovals.json' with { type: 'json' };
import mrPipelinesRaw from '../../fixtures/mrPipelines.json' with { type: 'json' };
import projectRaw from '../../fixtures/project.json' with { type: 'json' };
import branchesRaw from '../../fixtures/branches.json' with { type: 'json' };
import fileContentRaw from '../../fixtures/fileContent.json' with { type: 'json' };

describe('gitlabMapper', () => {
  describe('mapMr', () => {
    it('should map a full MR response', () => {
      const result = mapMr(mrRaw);

      expect(result).toEqual({
        id: 12345,
        iid: 42,
        title: 'Add user authentication module',
        description: 'Implements JWT-based authentication\n\n- Login endpoint\n- Token refresh\n- Password reset',
        state: 'opened',
        author: { id: 100, name: 'Jane Doe', username: 'janedoe' },
        sourceBranch: 'feature/auth',
        targetBranch: 'main',
        createdAt: '2025-06-01T10:00:00.000Z',
        updatedAt: '2025-06-15T14:30:00.000Z',
        mergedAt: null,
        closedAt: null,
        webUrl: 'https://gitlab.example.com/group/project/-/merge_requests/42',
        mergeStatus: 'can_be_merged',
        userNotesCount: 3,
      });
    });

    it('should handle null merge/close dates', () => {
      const result = mapMr(mrRaw);
      expect(result.mergedAt).toBeNull();
      expect(result.closedAt).toBeNull();
    });
  });

  describe('mapMrDiff', () => {
    it('should map a modified file diff', () => {
      const result = mapMrDiff(mrDiffsRaw[0]);

      expect(result).toEqual({
        oldPath: 'src/auth/login.js',
        newPath: 'src/auth/login.js',
        newFile: false,
        renamedFile: false,
        deletedFile: false,
        diff: expect.stringContaining('--- a/src/auth/login.js'),
        additions: 5,
        deletions: 1,
      });
    });

    it('should map a new file diff', () => {
      const result = mapMrDiff(mrDiffsRaw[1]);

      expect(result).toEqual({
        oldPath: 'src/utils/helpers.js',
        newPath: 'src/utils/helpers.js',
        newFile: true,
        renamedFile: false,
        deletedFile: false,
        diff: expect.stringContaining('--- /dev/null'),
        additions: 3,
        deletions: 0,
      });
    });

    it('should map a deleted file diff', () => {
      const result = mapMrDiff(mrDiffsRaw[2]);

      expect(result).toEqual({
        oldPath: 'src/legacy/auth_old.js',
        newPath: 'src/legacy/auth_old.js',
        newFile: false,
        renamedFile: false,
        deletedFile: true,
        diff: expect.stringContaining('--- a/src/legacy/auth_old.js'),
        additions: 0,
        deletions: 15,
      });
    });
  });

  describe('mapMrComment', () => {
    it('should map a discussion thread with replies', () => {
      const result = mapMrComment(mrCommentsRaw[0]);

      expect(result).toEqual({
        id: 'disc1',
        author: { id: 100, name: 'Jane Doe', username: 'janedoe' },
        body: 'I think we should also add rate limiting to the login endpoint',
        createdAt: '2025-06-02T11:00:00.000Z',
        resolved: false,
        replies: [
          {
            id: 1002,
            author: { id: 101, name: 'John Smith', username: 'johnsmith' },
            body: 'Good point. I\'ll add it in a follow-up MR.',
            createdAt: '2025-06-02T12:00:00.000Z',
          },
        ],
      });
    });

    it('should map an individual note without replies', () => {
      const result = mapMrComment(mrCommentsRaw[1]);

      expect(result).toEqual({
        id: 'disc2',
        author: { id: 102, name: 'Alice Wang', username: 'alicew' },
        body: 'LGTM, approved!',
        createdAt: '2025-06-03T09:00:00.000Z',
        resolved: false,
        replies: [],
      });
    });
  });

  describe('mapMrApproval', () => {
    it('should map an approved MR with approvers', () => {
      const result = mapMrApproval(mrApprovalsRaw);

      expect(result).toEqual({
        approved: true,
        approvers: [
          { id: 100, name: 'Jane Doe', username: 'janedoe' },
          { id: 101, name: 'John Smith', username: 'johnsmith' },
        ],
        approvalsRequired: 2,
        approvalsLeft: 0,
      });
    });

    it('should map a non-approved MR with no approvers', () => {
      const notApproved = {
        ...mrApprovalsRaw,
        approved_by: [],
        approvals_left: 2,
      };
      const result = mapMrApproval(notApproved);

      expect(result).toEqual({
        approved: false,
        approvers: [],
        approvalsRequired: 2,
        approvalsLeft: 2,
      });
    });

    it('should handle missing approved_by and approvals_left fields', () => {
      const noApprovals = { ...mrApprovalsRaw };
      delete noApprovals.approved_by;
      delete noApprovals.approvals_left;
      const result = mapMrApproval(noApprovals);

      expect(result).toEqual({
        approved: false,
        approvers: [],
        approvalsRequired: 2,
        approvalsLeft: 2,
      });
    });
  });

  describe('mapMrPipeline', () => {
    it('should map a success pipeline', () => {
      const result = mapMrPipeline(mrPipelinesRaw[0]);

      expect(result).toEqual({
        id: 5001,
        status: 'success',
        ref: 'feature/auth',
        sha: 'abc123def456',
        createdAt: '2025-06-10T08:00:00.000Z',
        updatedAt: '2025-06-10T08:15:00.000Z',
        webUrl: 'https://gitlab.example.com/group/project/-/pipelines/5001',
      });
    });

    it('should map a failed pipeline', () => {
      const result = mapMrPipeline(mrPipelinesRaw[1]);

      expect(result).toEqual({
        id: 5002,
        status: 'failed',
        ref: 'feature/auth',
        sha: 'abc123def456',
        createdAt: '2025-06-10T09:00:00.000Z',
        updatedAt: '2025-06-10T09:10:00.000Z',
        webUrl: 'https://gitlab.example.com/group/project/-/pipelines/5002',
      });
    });
  });

  describe('mapMrListItem', () => {
    it('should map a list item from an MR list', () => {
      const result = mapMrListItem(mrRaw);

      expect(result).toEqual({
        iid: 42,
        title: 'Add user authentication module',
        state: 'opened',
        author: { id: 100, name: 'Jane Doe', username: 'janedoe' },
        sourceBranch: 'feature/auth',
        targetBranch: 'main',
        createdAt: '2025-06-01T10:00:00.000Z',
        webUrl: 'https://gitlab.example.com/group/project/-/merge_requests/42',
      });
    });
  });

  describe('mapProject', () => {
    it('should map a project response', () => {
      const result = mapProject(projectRaw);

      expect(result).toEqual({
        id: 6789,
        name: 'project',
        nameWithNamespace: 'group / project',
        description: 'Main application repository',
        visibility: 'public',
        defaultBranch: 'main',
        webUrl: 'https://gitlab.example.com/group/project',
        avatarUrl: null,
      });
    });
  });

  describe('mapBranch', () => {
    it('should map a default branch', () => {
      const result = mapBranch(branchesRaw[0]);

      expect(result).toEqual({
        name: 'main',
        commit: {
          sha: 'abc123def456',
          message: 'Add initial project structure\n\nSet up the project with basic files',
          author: 'Jane Doe',
          date: '2025-05-01T10:00:00.000Z',
        },
        merged: false,
        protected: true,
        default: true,
      });
    });

    it('should map a non-default branch', () => {
      const result = mapBranch(branchesRaw[2]);

      expect(result).toEqual({
        name: 'feature/auth',
        commit: {
          sha: 'abc123def456',
          message: 'Add user authentication module',
          author: 'Jane Doe',
          date: '2025-06-01T10:00:00.000Z',
        },
        merged: false,
        protected: false,
        default: false,
      });
    });
  });

  describe('mapFileContent', () => {
    it('should map file content with metadata from response', () => {
      const mockResponse = {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'content-length': '128',
          'x-gitlab-blob-id': 'abc123',
        },
        config: {
          url: '/projects/group%2Fproject/repository/files/src%2Findex.js/raw',
          params: { ref: 'main' },
        },
      };

      const result = mapFileContent(fileContentRaw.content, mockResponse);

      expect(result).toEqual({
        content: fileContentRaw.content,
        fileName: fileContentRaw.filePath,
        size: 128,
        encoding: 'base64',
        ref: fileContentRaw.ref,
      });
    });

    it('should handle missing content-length header', () => {
      const mockResponse = { headers: {} };

      const result = mapFileContent('file content', mockResponse);

      expect(result.size).toBe('file content'.length);
      expect(result.content).toBe('file content');
      expect(result.fileName).toBe('');
    });
  });
});
