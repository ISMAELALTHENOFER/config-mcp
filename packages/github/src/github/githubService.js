import { get, getRaw, getAll } from './githubClient.js';
import {
  mapPullRequest,
  mapPullFile,
  mapPullComments,
  mapApproval,
  mapCheckRun,
  mapPullListItem,
  mapRepository,
  mapBranch,
  mapFileContent,
} from './githubMapper.js';
import { parseRepository } from '../utils/urlParser.js';
import { GithubError } from '../utils/errors.js';

// GitHub returns at most 3000 files for a pull request
const MAX_PULL_FILES = 3000;

/**
 * Build a repository API path from an "owner/repo" string or GitHub URL.
 */
function buildRepoApiPath(repository) {
  const { owner, repo } = parseRepository(repository);
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

/**
 * Get pull request details.
 *
 * @param {string} repository - Repository (e.g., "owner/repo")
 * @param {number} pullNumber - Pull request number
 * @returns {Promise<object>} Mapped PR object
 */
export async function getPullRequest(repository, pullNumber) {
  try {
    const data = await get(`${buildRepoApiPath(repository)}/pulls/${pullNumber}`);
    return mapPullRequest(data);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get pull request changed files with their patches.
 *
 * @param {string} repository - Repository
 * @param {number} pullNumber - Pull request number
 * @returns {Promise<{ files: Array, truncated: boolean }>} Mapped files; `truncated`
 *   is true when GitHub's 3000-file listing cap was reached
 */
export async function getPullRequestFiles(repository, pullNumber) {
  try {
    const data = await getAll(
      `${buildRepoApiPath(repository)}/pulls/${pullNumber}/files`,
    );
    return { files: data.map(mapPullFile), truncated: data.length >= MAX_PULL_FILES };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get pull request comments: conversation comments and inline review threads.
 *
 * @param {string} repository - Repository
 * @param {number} pullNumber - Pull request number
 * @returns {Promise<Array>} Array of mapped comment threads
 */
export async function getPullRequestComments(repository, pullNumber) {
  try {
    const base = buildRepoApiPath(repository);
    const [issueComments, reviewComments] = await Promise.all([
      getAll(`${base}/issues/${pullNumber}/comments`),
      getAll(`${base}/pulls/${pullNumber}/comments`),
    ]);
    return mapPullComments(issueComments, reviewComments);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get pull request review state.
 *
 * @param {string} repository - Repository
 * @param {number} pullNumber - Pull request number
 * @returns {Promise<object>} Mapped approval object
 */
export async function getPullRequestReviews(repository, pullNumber) {
  try {
    const data = await getAll(
      `${buildRepoApiPath(repository)}/pulls/${pullNumber}/reviews`,
    );
    return mapApproval(data);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get check runs for the head commit of a pull request.
 *
 * @param {string} repository - Repository
 * @param {number} pullNumber - Pull request number
 * @returns {Promise<Array>} Array of mapped check runs
 */
export async function getPullRequestChecks(repository, pullNumber) {
  try {
    const base = buildRepoApiPath(repository);
    const pull = await get(`${base}/pulls/${pullNumber}`);
    const headSha = pull.head?.sha;
    if (!headSha) {
      throw new GithubError('Pull request head SHA not available.', 404);
    }
    const data = await getAll(`${base}/commits/${headSha}/check-runs`, {}, 'check_runs');
    return data.map(mapCheckRun);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * List pull requests for a repository with optional filters.
 * GitHub has no "merged" state or label filter on this endpoint, so those are
 * applied after fetching.
 *
 * @param {string} repository - Repository
 * @param {object} [filters={}] - { state: open|closed|merged|all, base, head, labels }
 * @returns {Promise<Array>} Array of mapped PR list items
 */
export async function listPullRequests(repository, filters = {}) {
  try {
    const { state, base, head, labels } = filters;
    const params = {};
    if (state) params.state = state === 'merged' ? 'closed' : state;
    if (base) params.base = base;
    if (head) params.head = head;

    let data = await getAll(`${buildRepoApiPath(repository)}/pulls`, params);

    if (state === 'merged') {
      data = data.filter((pull) => pull.merged_at);
    }
    if (labels) {
      const wanted = labels.split(',').map((label) => label.trim().toLowerCase());
      data = data.filter((pull) => {
        const names = (pull.labels || []).map((label) => label.name.toLowerCase());
        return wanted.every((label) => names.includes(label));
      });
    }

    return data.map(mapPullListItem);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get repository details.
 *
 * @param {string} repository - Repository
 * @returns {Promise<object>} Mapped repository object
 */
export async function getRepository(repository) {
  try {
    const data = await get(buildRepoApiPath(repository));
    return mapRepository(data);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * List repository branches with optional search.
 * GitHub has no server-side branch search, so names are filtered after fetching.
 *
 * @param {string} repository - Repository
 * @param {string} [search] - Case-insensitive substring of the branch name
 * @returns {Promise<Array>} Array of mapped branches
 */
export async function listBranches(repository, search) {
  try {
    let data = await getAll(`${buildRepoApiPath(repository)}/branches`, {});
    if (search) {
      const needle = search.toLowerCase();
      data = data.filter((branch) => branch.name.toLowerCase().includes(needle));
    }
    return data.map(mapBranch);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get file content from a repository.
 *
 * @param {string} repository - Repository
 * @param {string} filePath - Path to the file in the repository
 * @param {string} [ref] - Branch name, tag, or commit SHA
 * @returns {Promise<object>} Mapped file content object
 */
export async function getFileContent(repository, filePath, ref) {
  try {
    const encodedFilePath = filePath.split('/').map(encodeURIComponent).join('/');
    const params = {};
    if (ref) {
      params.ref = ref;
    }

    const response = await getRaw(
      `${buildRepoApiPath(repository)}/contents/${encodedFilePath}`,
      params,
    );

    return mapFileContent(response.data, response);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Wrap errors as GithubError if they aren't already.
 *
 * @param {Error} err
 * @returns {Error}
 */
function wrapError(err) {
  if (err instanceof GithubError) {
    return err;
  }
  return new GithubError(err.message, err.statusCode || 500);
}
