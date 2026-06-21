import { ValidationError } from './errors.js';

/**
 * Parse a GitLab merge request URL into project path and MR IID.
 *
 * Pattern: {base_url}/{project_path}/-/merge_requests/{iid}
 *
 * @param {string} url - Full GitLab MR URL
 * @returns {{ projectPath: string, mrIid: number }}
 * @throws {ValidationError} If URL is invalid or not a merge request URL
 */
export function parseMrUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL is required');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ValidationError('Invalid GitLab MR URL');
  }

  const pathname = parsedUrl.pathname;

  // Find the /-/merge_requests/ segment
  const mrSegment = '/-/merge_requests/';
  const mrIndex = pathname.indexOf(mrSegment);

  if (mrIndex === -1) {
    throw new ValidationError('URL is not a merge request');
  }

  // Everything before /-/merge_requests/ is the project path (strip leading /)
  const projectPath = pathname.slice(1, mrIndex);

  // Everything after /-/merge_requests/ is the MR IID
  const iidStr = pathname.slice(mrIndex + mrSegment.length);

  // Parse as integer, reject non-numeric
  const mrIid = Number.parseInt(iidStr, 10);

  if (!Number.isInteger(mrIid) || mrIid <= 0) {
    throw new ValidationError('MR IID must be a positive integer');
  }

  return { projectPath, mrIid };
}

/**
 * Encode a project path for use in GitLab API v4 URLs.
 *
 * GitLab API requires slashes in paths to be encoded as %2F.
 *
 * @param {string} path - Project path (e.g., "group/project" or "group/subgroup/project")
 * @returns {string} URL-encoded path
 */
export function encodeProjectPath(path) {
  // If already encoded, return as-is
  if (path.includes('%2F')) {
    return path;
  }

  return path.replace(/\//g, '%2F');
}
