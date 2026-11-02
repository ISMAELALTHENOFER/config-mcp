import { describe, it, expect } from '@jest/globals';
import {
  mapPullRequest,
  mapPullFile,
  mapPullComments,
  mapReview,
  mapApproval,
  mapCheckRun,
  mapPullListItem,
  mapRepository,
  mapBranch,
  mapFileContent,
} from '../../../src/github/githubMapper.js';

import pullRaw from '../../fixtures/pull.json' with { type: 'json' };
import pullFilesRaw from '../../fixtures/pullFiles.json' with { type: 'json' };
import issueCommentsRaw from '../../fixtures/issueComments.json' with { type: 'json' };
import reviewCommentsRaw from '../../fixtures/reviewComments.json' with { type: 'json' };
import reviewsRaw from '../../fixtures/reviews.json' with { type: 'json' };
import checkRunsRaw from '../../fixtures/checkRuns.json' with { type: 'json' };
import repoRaw from '../../fixtures/repo.json' with { type: 'json' };
import branchesRaw from '../../fixtures/branches.json' with { type: 'json' };
import fileContentRaw from '../../fixtures/fileContent.json' with { type: 'json' };

describe('githubMapper', () => {
  describe('mapPullRequest', () => {
    it('should map a full PR response including head/base SHAs', () => {
      expect(mapPullRequest(pullRaw)).toEqual({
        id: 12345,
        number: 42,
        title: 'Add user authentication module',
        description:
          'Implements JWT-based authentication\n\n- Login endpoint\n- Token refresh',
        state: 'open',
        draft: false,
        author: { id: 100, login: 'janedoe' },
        headBranch: 'feature/auth',
        baseBranch: 'main',
        headSha: 'abc123def456',
        baseSha: '000111222333',
        createdAt: '2025-06-01T10:00:00Z',
        updatedAt: '2025-06-15T14:30:00Z',
        mergedAt: null,
        closedAt: null,
        webUrl: 'https://github.com/octo/project/pull/42',
        mergeable: true,
        mergeableState: 'clean',
        mergeCommitSha: null,
        commentsCount: 3,
        changedFiles: 3,
        additions: 8,
        deletions: 16,
        labels: ['bug'],
      });
    });

    it('should report merged state and keep missing fields null', () => {
      const merged = mapPullRequest({
        ...pullRaw,
        state: 'closed',
        merged_at: '2025-06-20T10:00:00Z',
        closed_at: '2025-06-20T10:00:00Z',
        merge_commit_sha: 'fff',
      });
      expect(merged).toMatchObject({ state: 'merged', mergeCommitSha: 'fff' });

      const sparse = mapPullRequest({ id: 1, number: 1, title: 't', state: 'open' });
      expect(sparse).toMatchObject({
        author: null,
        headSha: null,
        baseSha: null,
        headBranch: null,
        baseBranch: null,
        mergeable: null,
        mergeableState: null,
        commentsCount: 0,
        labels: [],
      });
    });
  });

  describe('mapPullFile', () => {
    it('should map a modified file with its patch', () => {
      expect(mapPullFile(pullFilesRaw[0])).toEqual({
        filename: 'src/auth/login.js',
        previousFilename: null,
        status: 'modified',
        additions: 5,
        deletions: 1,
        changes: 6,
        patch: expect.stringContaining('@@ -1,5 +1,8 @@'),
        patchOmitted: false,
      });
    });

    it('flags missing patch text (binary, too large or no textual change) as omitted', () => {
      expect(mapPullFile(pullFilesRaw[2])).toMatchObject({
        filename: 'assets/logo.png',
        patch: null,
        patchOmitted: true,
      });
      expect(mapPullFile(pullFilesRaw[3])).toMatchObject({
        filename: 'src/new-name.js',
        previousFilename: 'src/old-name.js',
        status: 'renamed',
        patch: null,
        patchOmitted: true,
      });
    });

    it('distinguishes an empty patch string from a missing one', () => {
      expect(mapPullFile({ filename: 'a', status: 'modified', patch: '' })).toMatchObject(
        {
          patch: '',
          patchOmitted: false,
        },
      );
    });
  });

  describe('mapPullComments', () => {
    it('should merge issue comments and review threads ordered by creation time', () => {
      expect(mapPullComments(issueCommentsRaw, reviewCommentsRaw)).toEqual([
        {
          id: 8001,
          kind: 'review',
          author: { id: 100, login: 'janedoe' },
          body: 'Add rate limiting to the login endpoint',
          path: 'src/auth/login.js',
          line: 3,
          createdAt: '2025-06-02T11:00:00Z',
          resolved: null,
          replies: [
            {
              id: 8002,
              author: { id: 101, login: 'johnsmith' },
              body: 'Good point, follow-up PR.',
              createdAt: '2025-06-02T12:00:00Z',
            },
          ],
        },
        {
          id: 9001,
          kind: 'issue',
          author: { id: 102, login: 'alicew' },
          body: 'LGTM overall',
          path: null,
          line: null,
          createdAt: '2025-06-03T09:00:00Z',
          resolved: null,
          replies: [],
        },
      ]);
    });

    it('should treat a reply whose root is missing as its own thread', () => {
      const orphan = { ...reviewCommentsRaw[1], id: 8003, in_reply_to_id: 1 };
      const result = mapPullComments([], [orphan]);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 8003, kind: 'review', replies: [] });
    });

    it('should handle empty input and null authors/lines', () => {
      expect(mapPullComments([], [])).toEqual([]);
      const [thread] = mapPullComments(
        [],
        [{ id: 1, body: 'x', created_at: '2025-01-01T00:00:00Z', path: 'a' }],
      );
      expect(thread).toMatchObject({ author: null, line: null });
    });
  });

  describe('mapReview / mapApproval', () => {
    it('should map a single review', () => {
      expect(mapReview(reviewsRaw[0])).toEqual({
        id: 7001,
        author: { id: 100, login: 'janedoe' },
        state: 'CHANGES_REQUESTED',
        body: 'Needs tests',
        submittedAt: '2025-06-04T09:00:00Z',
        commitId: 'abc123def456',
      });
    });

    it('should use each reviewer latest decisive review', () => {
      const result = mapApproval(reviewsRaw);

      expect(result.approved).toBe(true);
      expect(result.approvers).toEqual([
        { id: 100, login: 'janedoe' },
        { id: 101, login: 'johnsmith' },
      ]);
      expect(result.changesRequestedBy).toEqual([]);
      expect(result.reviews).toHaveLength(4);
    });

    it('should not report approval while changes are requested', () => {
      const result = mapApproval(reviewsRaw.slice(0, 2));

      expect(result.approved).toBe(false);
      expect(result.approvers).toEqual([{ id: 101, login: 'johnsmith' }]);
      expect(result.changesRequestedBy).toEqual([{ id: 100, login: 'janedoe' }]);
    });

    it('should let a dismissal clear an earlier decision and ignore comment-only/pending reviews', () => {
      const result = mapApproval([
        reviewsRaw[1],
        { ...reviewsRaw[1], id: 1, state: 'DISMISSED' },
        { ...reviewsRaw[3], id: 2 },
        { id: 3, user: { id: 5, login: 'p' }, state: 'PENDING' },
        { id: 4, state: 'APPROVED', submitted_at: '2025-01-01T00:00:00Z' },
      ]);

      expect(result.approved).toBe(false);
      expect(result.approvers).toEqual([]);
      expect(result.changesRequestedBy).toEqual([]);
    });

    it('should handle no reviews', () => {
      expect(mapApproval([])).toEqual({
        approved: false,
        approvers: [],
        changesRequestedBy: [],
        reviews: [],
      });
    });
  });

  describe('mapCheckRun', () => {
    it('should map a completed check run', () => {
      expect(mapCheckRun(checkRunsRaw[0])).toEqual({
        id: 5001,
        name: 'build',
        status: 'completed',
        conclusion: 'success',
        sha: 'abc123def456',
        app: 'github-actions',
        startedAt: '2025-06-10T08:00:00Z',
        completedAt: '2025-06-10T08:15:00Z',
        webUrl: 'https://github.com/octo/project/runs/5001',
      });
    });

    it('should map an in-progress check run without conclusion or app', () => {
      expect(mapCheckRun(checkRunsRaw[1])).toMatchObject({
        status: 'in_progress',
        conclusion: null,
        app: null,
        completedAt: null,
      });
    });
  });

  describe('mapPullListItem', () => {
    it('should map a list item', () => {
      expect(mapPullListItem(pullRaw)).toEqual({
        number: 42,
        title: 'Add user authentication module',
        state: 'open',
        draft: false,
        author: { id: 100, login: 'janedoe' },
        headBranch: 'feature/auth',
        baseBranch: 'main',
        createdAt: '2025-06-01T10:00:00Z',
        webUrl: 'https://github.com/octo/project/pull/42',
      });
    });

    it('should report merged PRs as merged', () => {
      expect(
        mapPullListItem({
          ...pullRaw,
          state: 'closed',
          merged_at: '2025-06-20T10:00:00Z',
        }).state,
      ).toBe('merged');
    });
  });

  describe('mapRepository', () => {
    it('should map a repository response', () => {
      expect(mapRepository(repoRaw)).toEqual({
        id: 6789,
        name: 'project',
        fullName: 'octo/project',
        description: 'Main application repository',
        visibility: 'public',
        private: false,
        archived: false,
        defaultBranch: 'main',
        webUrl: 'https://github.com/octo/project',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1',
      });
    });

    it('should derive visibility from private when absent and tolerate missing owner', () => {
      const raw = { ...repoRaw, private: true, owner: undefined };
      delete raw.visibility;
      expect(mapRepository(raw)).toMatchObject({
        visibility: 'private',
        private: true,
        avatarUrl: null,
      });
    });
  });

  describe('mapBranch', () => {
    it('should map a protected branch', () => {
      expect(mapBranch(branchesRaw[0])).toEqual({
        name: 'main',
        commit: { sha: 'abc123def456' },
        protected: true,
      });
    });

    it('should tolerate a missing commit', () => {
      expect(mapBranch({ name: 'x', protected: false }).commit).toBeNull();
    });
  });

  describe('mapFileContent', () => {
    it('should map file content with metadata from the response config', () => {
      const mockResponse = {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
        config: {
          url: '/repos/octo/project/contents/src/index.js',
          params: { ref: 'main' },
        },
      };

      expect(mapFileContent(fileContentRaw.content, mockResponse)).toEqual({
        content: fileContentRaw.content,
        fileName: fileContentRaw.filePath,
        size: Buffer.byteLength(fileContentRaw.content),
        encoding: 'utf-8',
        ref: fileContentRaw.ref,
      });
    });

    it('should decode percent-encoded file names and handle a missing config', () => {
      expect(
        mapFileContent('x', { config: { url: '/repos/o/r/contents/dir/a%20b.md' } }),
      ).toMatchObject({ fileName: 'dir/a b.md', ref: '' });
      expect(mapFileContent('file content', { headers: {} })).toMatchObject({
        fileName: '',
        size: 'file content'.length,
      });
      expect(mapFileContent('x', { config: { url: '/other' } }).fileName).toBe('');
    });

    it('preserves UTF-8 byte size and base64-encodes non-text bytes', () => {
      const text = Buffer.from('café\n', 'utf8');
      expect(mapFileContent(text, { headers: {} })).toMatchObject({
        content: 'café\n',
        size: text.length,
        encoding: 'utf-8',
      });
      const binary = Buffer.from([0x00, 0xff, 0x80]);
      expect(mapFileContent(binary, { headers: {} })).toMatchObject({
        content: binary.toString('base64'),
        size: binary.length,
        encoding: 'base64',
      });
      expect(mapFileContent(Buffer.alloc(0), { headers: {} })).toMatchObject({
        content: '',
        size: 0,
        encoding: 'utf-8',
      });
    });
  });
});
