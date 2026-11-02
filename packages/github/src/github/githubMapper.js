function mapUser(user) {
  return user ? { id: user.id, login: user.login } : null;
}

/**
 * GitHub reports merged PRs as state "closed" with merged_at set.
 */
function pullState(raw) {
  return raw.merged_at ? 'merged' : raw.state;
}

/**
 * Map a raw GitHub pull request API response to a clean PR object.
 *
 * @param {object} raw - Raw PR response from /repos/{owner}/{repo}/pulls/{number}
 * @returns {{ id, number, title, description, state, draft, author, headBranch, baseBranch, headSha, baseSha, createdAt, updatedAt, mergedAt, closedAt, webUrl, mergeable, mergeableState, mergeCommitSha, commentsCount, changedFiles, additions, deletions, labels }}
 */
export function mapPullRequest(raw) {
  return {
    id: raw.id,
    number: raw.number,
    title: raw.title,
    description: raw.body ?? null,
    state: pullState(raw),
    draft: raw.draft ?? false,
    author: mapUser(raw.user),
    headBranch: raw.head?.ref ?? null,
    baseBranch: raw.base?.ref ?? null,
    headSha: raw.head?.sha ?? null,
    baseSha: raw.base?.sha ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    mergedAt: raw.merged_at || null,
    closedAt: raw.closed_at || null,
    webUrl: raw.html_url,
    mergeable: raw.mergeable ?? null,
    mergeableState: raw.mergeable_state ?? null,
    mergeCommitSha: raw.merge_commit_sha ?? null,
    commentsCount: (raw.comments ?? 0) + (raw.review_comments ?? 0),
    changedFiles: raw.changed_files,
    additions: raw.additions,
    deletions: raw.deletions,
    labels: (raw.labels || []).map((label) => label.name),
  };
}

/**
 * Map a raw changed-file entry to a clean file diff object.
 * GitHub omits `patch` for binary files, very large diffs and files without
 * textual changes (e.g. pure renames), so a missing patch is flagged explicitly.
 *
 * @param {object} raw - File entry from /repos/{owner}/{repo}/pulls/{number}/files
 * @returns {{ filename, previousFilename, status, additions, deletions, changes, patch, patchOmitted }}
 */
export function mapPullFile(raw) {
  return {
    filename: raw.filename,
    previousFilename: raw.previous_filename ?? null,
    status: raw.status,
    additions: raw.additions,
    deletions: raw.deletions,
    changes: raw.changes,
    patch: raw.patch ?? null,
    patchOmitted: typeof raw.patch !== 'string',
  };
}

/**
 * Merge PR conversation comments and inline review comments into thread objects.
 * Review comments are grouped by root comment; replies follow in creation order.
 * GitHub REST does not expose thread resolution, so `resolved` is always null.
 *
 * @param {Array} issueComments - From /repos/{owner}/{repo}/issues/{number}/comments
 * @param {Array} reviewComments - From /repos/{owner}/{repo}/pulls/{number}/comments
 * @returns {Array<{ id, kind, author, body, path, line, createdAt, resolved, replies: Array }>}
 */
export function mapPullComments(issueComments, reviewComments) {
  const issueThreads = issueComments.map((raw) => ({
    id: raw.id,
    kind: 'issue',
    author: mapUser(raw.user),
    body: raw.body,
    path: null,
    line: null,
    createdAt: raw.created_at,
    resolved: null,
    replies: [],
  }));

  const ids = new Set(reviewComments.map((raw) => raw.id));
  const roots = reviewComments.filter(
    (raw) => !raw.in_reply_to_id || !ids.has(raw.in_reply_to_id),
  );

  const reviewThreads = roots.map((root) => ({
    id: root.id,
    kind: 'review',
    author: mapUser(root.user),
    body: root.body,
    path: root.path ?? null,
    line: root.line ?? null,
    createdAt: root.created_at,
    resolved: null,
    replies: reviewComments
      .filter((raw) => raw.in_reply_to_id === root.id)
      .map((raw) => ({
        id: raw.id,
        author: mapUser(raw.user),
        body: raw.body,
        createdAt: raw.created_at,
      })),
  }));

  return [...issueThreads, ...reviewThreads].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
  );
}

/**
 * Map a raw review to a clean review object.
 *
 * @param {object} raw - Review from /repos/{owner}/{repo}/pulls/{number}/reviews
 * @returns {{ id, author, state, body, submittedAt, commitId }}
 */
export function mapReview(raw) {
  return {
    id: raw.id,
    author: mapUser(raw.user),
    state: raw.state,
    body: raw.body ?? '',
    submittedAt: raw.submitted_at ?? null,
    commitId: raw.commit_id ?? null,
  };
}

/**
 * Summarise reviews into an approval state.
 * Each reviewer counts once, by their latest APPROVED or CHANGES_REQUESTED review;
 * a DISMISSED review clears it. COMMENTED and PENDING reviews do not change it.
 *
 * @param {Array} rawReviews - Reviews in chronological order
 * @returns {{ approved: boolean, approvers: Array, changesRequestedBy: Array, reviews: Array }}
 */
export function mapApproval(rawReviews) {
  const decisions = new Map();

  for (const raw of rawReviews) {
    if (!raw.user) continue;
    if (raw.state === 'APPROVED' || raw.state === 'CHANGES_REQUESTED') {
      decisions.set(raw.user.id, { state: raw.state, user: mapUser(raw.user) });
    } else if (raw.state === 'DISMISSED') {
      decisions.delete(raw.user.id);
    }
  }

  const byState = (state) =>
    [...decisions.values()].filter((d) => d.state === state).map((d) => d.user);
  const approvers = byState('APPROVED');
  const changesRequestedBy = byState('CHANGES_REQUESTED');

  return {
    approved: approvers.length > 0 && changesRequestedBy.length === 0,
    approvers,
    changesRequestedBy,
    reviews: rawReviews.map(mapReview),
  };
}

/**
 * Map a raw check run to a clean check object.
 *
 * @param {object} raw - Check run from /repos/{owner}/{repo}/commits/{sha}/check-runs
 * @returns {{ id, name, status, conclusion, sha, app, startedAt, completedAt, webUrl }}
 */
export function mapCheckRun(raw) {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    conclusion: raw.conclusion ?? null,
    sha: raw.head_sha,
    app: raw.app?.slug ?? null,
    startedAt: raw.started_at ?? null,
    completedAt: raw.completed_at ?? null,
    webUrl: raw.html_url,
  };
}

/**
 * Map a raw PR list item to a clean list item.
 *
 * @param {object} raw - PR item from /repos/{owner}/{repo}/pulls list
 * @returns {{ number, title, state, draft, author, headBranch, baseBranch, createdAt, webUrl }}
 */
export function mapPullListItem(raw) {
  return {
    number: raw.number,
    title: raw.title,
    state: pullState(raw),
    draft: raw.draft ?? false,
    author: mapUser(raw.user),
    headBranch: raw.head?.ref ?? null,
    baseBranch: raw.base?.ref ?? null,
    createdAt: raw.created_at,
    webUrl: raw.html_url,
  };
}

/**
 * Map a raw repository response to a clean repository object.
 *
 * @param {object} raw - Repository response from /repos/{owner}/{repo}
 * @returns {{ id, name, fullName, description, visibility, private, archived, defaultBranch, webUrl, avatarUrl }}
 */
export function mapRepository(raw) {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description,
    visibility: raw.visibility ?? (raw.private ? 'private' : 'public'),
    private: raw.private,
    archived: raw.archived ?? false,
    defaultBranch: raw.default_branch,
    webUrl: raw.html_url,
    avatarUrl: raw.owner?.avatar_url || null,
  };
}

/**
 * Map a raw branch response to a clean branch object.
 * The branch list only carries the head commit SHA.
 *
 * @param {object} raw - Branch from /repos/{owner}/{repo}/branches
 * @returns {{ name, commit: { sha }, protected }}
 */
export function mapBranch(raw) {
  return {
    name: raw.name,
    commit: raw.commit ? { sha: raw.commit.sha } : null,
    protected: raw.protected,
  };
}

/**
 * Map raw file content and response metadata to a clean file content object.
 *
 * @param {Buffer|string} raw - Raw bytes from /repos/{owner}/{repo}/contents/{path}
 * @param {object} response - Full Axios response object (for request config)
 * @returns {{ content, fileName, size, encoding, ref }}
 */
export function mapFileContent(raw, response) {
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  let content;
  let encoding;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (content.includes('\0')) throw new TypeError('Binary content');
    encoding = 'utf-8';
  } catch {
    content = bytes.toString('base64');
    encoding = 'base64';
  }

  return {
    content,
    fileName: response.config?.url ? extractFileNameFromUrl(response.config.url) : '',
    size: bytes.length,
    encoding,
    ref: response.config?.params?.ref || '',
  };
}

/**
 * Extract a human-readable file name from a GitHub API contents URL.
 * Example: /repos/owner/repo/contents/src/index.js → src/index.js
 *
 * @param {string} url - The request URL
 * @returns {string} Extracted file path
 */
function extractFileNameFromUrl(url) {
  const match = url.match(/\/contents\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : '';
}
