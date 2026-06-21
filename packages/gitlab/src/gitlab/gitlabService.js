import { get, getRaw, getAll } from './gitlabClient.js';
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
} from './gitlabMapper.js';
import { encodeProjectPath } from '../utils/urlParser.js';
import { GitlabError } from '../utils/errors.js';

/**
 * Build a project API path from a project path string.
 */
function buildProjectApiPath(path) {
  const encoded = encodeProjectPath(path);
  return `/projects/${encoded}`;
}

/**
 * Get merge request details.
 *
 * @param {string} projectPath - Project path (e.g., "group/project")
 * @param {number} mrIid - Merge request IID
 * @returns {Promise<object>} Mapped MR object
 */
export async function getMr(projectPath, mrIid) {
  try {
    const data = await get(`${buildProjectApiPath(projectPath)}/merge_requests/${mrIid}`);
    return mapMr(data);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get merge request diffs.
 *
 * @param {string} projectPath - Project path
 * @param {number} mrIid - Merge request IID
 * @returns {Promise<Array>} Array of mapped diffs
 */
export async function getMrDiffs(projectPath, mrIid) {
  try {
    const data = await get(
      `${buildProjectApiPath(projectPath)}/merge_requests/${mrIid}/diffs`,
    );
    return data.map(mapMrDiff);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get merge request discussion comments.
 *
 * @param {string} projectPath - Project path
 * @param {number} mrIid - Merge request IID
 * @returns {Promise<Array>} Array of mapped comment threads
 */
export async function getMrComments(projectPath, mrIid) {
  try {
    const data = await get(
      `${buildProjectApiPath(projectPath)}/merge_requests/${mrIid}/discussions`,
    );
    return data.map(mapMrComment);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get merge request approval state.
 *
 * @param {string} projectPath - Project path
 * @param {number} mrIid - Merge request IID
 * @returns {Promise<object>} Mapped approval object
 */
export async function getMrApprovals(projectPath, mrIid) {
  try {
    const data = await get(
      `${buildProjectApiPath(projectPath)}/merge_requests/${mrIid}/approvals`,
    );
    return mapMrApproval(data);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get merge request pipelines.
 *
 * @param {string} projectPath - Project path
 * @param {number} mrIid - Merge request IID
 * @returns {Promise<Array>} Array of mapped pipelines
 */
export async function getMrPipelines(projectPath, mrIid) {
  try {
    const data = await get(
      `${buildProjectApiPath(projectPath)}/merge_requests/${mrIid}/pipelines`,
    );
    return data.map(mapMrPipeline);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * List merge requests for a project with optional filters.
 *
 * @param {string} projectPath - Project path
 * @param {object} [filters={}] - Filter params (state, labels, search, etc.)
 * @returns {Promise<Array>} Array of mapped MR list items
 */
export async function listProjectMrs(projectPath, filters = {}) {
  try {
    const data = await getAll(
      `${buildProjectApiPath(projectPath)}/merge_requests`,
      filters,
    );
    return data.map(mapMrListItem);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get project details.
 *
 * @param {string} projectPath - Project path
 * @returns {Promise<object>} Mapped project object
 */
export async function getProject(projectPath) {
  try {
    const data = await get(`${buildProjectApiPath(projectPath)}`);
    return mapProject(data);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * List repository branches with optional search.
 *
 * @param {string} projectPath - Project path
 * @param {string} [search] - Search pattern for branch names
 * @returns {Promise<Array>} Array of mapped branches
 */
export async function listBranches(projectPath, search) {
  try {
    const params = {};
    if (search) {
      params.search = search;
    }
    const data = await getAll(
      `${buildProjectApiPath(projectPath)}/repository/branches`,
      params,
    );
    return data.map(mapBranch);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get file content from a repository.
 *
 * @param {string} projectPath - Project path
 * @param {string} filePath - Path to the file in the repository
 * @param {string} [ref] - Branch name, tag, or commit SHA
 * @returns {Promise<object>} Mapped file content object
 */
export async function getFileContent(projectPath, filePath, ref) {
  try {
    const encodedFilePath = encodeURIComponent(filePath);
    const params = {};
    if (ref) {
      params.ref = ref;
    }

    const response = await getRaw(
      `${buildProjectApiPath(projectPath)}/repository/files/${encodedFilePath}/raw`,
      params,
    );

    return mapFileContent(response.data, response);
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Wrap errors as GitlabError if they aren't already.
 *
 * @param {Error} err
 * @returns {Error}
 */
function wrapError(err) {
  if (err instanceof GitlabError) {
    return err;
  }
  return new GitlabError(err.message, err.statusCode || 500);
}
