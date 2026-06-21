/**
 * Map a raw GitLab MR API response to a clean MR object.
 *
 * @param {object} raw - Raw MR response from /projects/{id}/merge_requests/{mr_iid}
 * @returns {{ id, iid, title, description, state, author, sourceBranch, targetBranch, createdAt, updatedAt, mergedAt, closedAt, webUrl, mergeStatus, userNotesCount }}
 */
export function mapMr(raw) {
  return {
    id: raw.id,
    iid: raw.iid,
    title: raw.title,
    description: raw.description,
    state: raw.state,
    author: raw.author
      ? { id: raw.author.id, name: raw.author.name, username: raw.author.username }
      : null,
    sourceBranch: raw.source_branch,
    targetBranch: raw.target_branch,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    mergedAt: raw.merged_at || null,
    closedAt: raw.closed_at || null,
    webUrl: raw.web_url,
    mergeStatus: raw.merge_status,
    userNotesCount: raw.user_notes_count,
  };
}

/**
 * Map a raw diff entry to a clean diff object.
 *
 * @param {object} raw - Diff entry from /projects/{id}/merge_requests/{mr_iid}/diffs
 * @returns {{ oldPath, newPath, newFile, renamedFile, deletedFile, diff, additions, deletions }}
 */
export function mapMrDiff(raw) {
  return {
    oldPath: raw.old_path,
    newPath: raw.new_path,
    newFile: raw.new_file,
    renamedFile: raw.renamed_file,
    deletedFile: raw.deleted_file,
    diff: raw.diff,
    additions: raw.additions,
    deletions: raw.deletions,
  };
}

/**
 * Map a raw GitLab discussion to a thread structure.
 *
 * @param {object} raw - Discussion from /projects/{id}/merge_requests/{mr_iid}/discussions
 * @returns {{ id, author, body, createdAt, resolved, replies: Array }}
 */
export function mapMrComment(raw) {
  const rootNote = raw.notes[0];

  // Replies are all notes after the first one
  const replies = raw.notes.slice(1).map((note) => ({
    id: note.id,
    author: note.author
      ? { id: note.author.id, name: note.author.name, username: note.author.username }
      : null,
    body: note.body,
    createdAt: note.created_at,
  }));

  return {
    id: raw.id,
    author: rootNote.author
      ? { id: rootNote.author.id, name: rootNote.author.name, username: rootNote.author.username }
      : null,
    body: rootNote.body,
    createdAt: rootNote.created_at,
    resolved: rootNote.resolved === true,
    replies,
  };
}

/**
 * Map a raw GitLab approval response to a clean approval object.
 *
 * @param {object} raw - Approval response from /projects/{id}/merge_requests/{mr_iid}/approvals
 * @returns {{ approved: boolean, approvers: Array, approvalsRequired: number, approvalsLeft: number }}
 */
export function mapMrApproval(raw) {
  const approvers = (raw.approved_by || []).map((entry) => ({
    id: entry.user.id,
    name: entry.user.name,
    username: entry.user.username,
  }));

  return {
    approved: approvers.length > 0,
    approvers,
    approvalsRequired: raw.approvals_required || 0,
    approvalsLeft: raw.approvals_left ?? (raw.approvals_required || 0),
  };
}

/**
 * Map a raw pipeline to a clean pipeline object.
 *
 * @param {object} raw - Pipeline from /projects/{id}/merge_requests/{mr_iid}/pipelines
 * @returns {{ id, status, ref, sha, createdAt, updatedAt, webUrl }}
 */
export function mapMrPipeline(raw) {
  return {
    id: raw.id,
    status: raw.status,
    ref: raw.ref,
    sha: raw.sha,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    webUrl: raw.web_url,
  };
}

/**
 * Map a raw MR list item to a clean list item.
 *
 * @param {object} raw - MR item from /projects/{id}/merge_requests list
 * @returns {{ iid, title, state, author, sourceBranch, targetBranch, createdAt, webUrl }}
 */
export function mapMrListItem(raw) {
  return {
    iid: raw.iid,
    title: raw.title,
    state: raw.state,
    author: raw.author
      ? { id: raw.author.id, name: raw.author.name, username: raw.author.username }
      : null,
    sourceBranch: raw.source_branch,
    targetBranch: raw.target_branch,
    createdAt: raw.created_at,
    webUrl: raw.web_url,
  };
}

/**
 * Map a raw project response to a clean project object.
 *
 * @param {object} raw - Project response from /projects/{id}
 * @returns {{ id, name, nameWithNamespace, description, visibility, defaultBranch, webUrl, avatarUrl }}
 */
export function mapProject(raw) {
  return {
    id: raw.id,
    name: raw.name,
    nameWithNamespace: raw.name_with_namespace,
    description: raw.description,
    visibility: raw.visibility,
    defaultBranch: raw.default_branch,
    webUrl: raw.web_url,
    avatarUrl: raw.avatar_url || null,
  };
}

/**
 * Map a raw branch response to a clean branch object.
 *
 * @param {object} raw - Branch from /projects/{id}/repository/branches
 * @returns {{ name, commit: { sha, message, author, date }, merged, protected, default }}
 */
export function mapBranch(raw) {
  return {
    name: raw.name,
    commit: raw.commit
      ? {
          sha: raw.commit.id,
          message: raw.commit.message,
          author: raw.commit.author_name,
          date: raw.commit.created_at,
        }
      : null,
    merged: raw.merged,
    protected: raw.protected,
    default: raw.default,
  };
}

/**
 * Map raw file content and response metadata to a clean file content object.
 *
 * @param {string} raw - Raw file content from /projects/{id}/repository/files/{path}/raw
 * @param {object} response - Full Axios response object (for headers)
 * @returns {{ content, fileName, size, encoding, ref }}
 */
export function mapFileContent(raw, response) {
  const size =
    parseInt(response.headers['content-length'] || '0', 10) ||
    (typeof raw === 'string' ? raw.length : 0);

  return {
    content: raw,
    fileName: response.config?.url
      ? extractFileNameFromUrl(response.config.url)
      : '',
    size,
    encoding: 'base64',
    ref: response.config?.params?.ref || '',
  };
}

/**
 * Extract a human-readable file name from a GitLab API raw file URL.
 * Example: /projects/group%2Fproject/repository/files/src%2Findex.js/raw → src/index.js
 *
 * @param {string} url - The request URL
 * @returns {string} Extracted file path
 */
function extractFileNameFromUrl(url) {
  const match = url.match(/\/repository\/files\/(.+?)\/raw/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return '';
}
