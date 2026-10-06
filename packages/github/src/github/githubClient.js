import axios from 'axios';
import { env } from '../config/env.js';
import { limiter } from '@config-mcp/mcp-core';
import { logger } from '../utils/logger.js';
import { GithubError } from '../utils/errors.js';

const githubAxios = axios.create({
  baseURL: env.GITHUB_API_URL.replace(/\/+$/, ''),
  headers: {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
  timeout: 30000,
});

githubAxios.interceptors.request.use((config) => {
  logger.debug('GitHub API request', {
    method: config.method,
    url: config.url,
  });
  return config;
});

githubAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error, DNS failure, timeout, etc.
      throw error;
    }

    const status = error.response.status;

    switch (status) {
      case 401:
        throw new GithubError('GitHub authentication failed. Check your token.', 401);
      case 403:
        // GitHub reports an exhausted primary rate limit as 403, not 429
        if (error.response.headers?.['x-ratelimit-remaining'] === '0') {
          throw new GithubError('GitHub rate limit exceeded. Try again later.', 429);
        }
        throw new GithubError(
          'GitHub access denied. Token lacks permissions for this resource.',
          403,
        );
      case 404:
        throw new GithubError('GitHub resource not found.', 404);
      case 429:
        throw new GithubError('GitHub rate limit exceeded. Try again later.', 429);
      default:
        throw new GithubError(`GitHub request failed (${status})`, status);
    }
  },
);

/**
 * Make a single GET request to the GitHub API.
 * Returns the response data (JSON body).
 *
 * @param {string} path - API path (e.g., "/repos/owner/repo/pulls/1")
 * @param {object} [params={}] - Query parameters
 * @returns {Promise<object>} Response data
 */
export async function get(path, params = {}) {
  return limiter.schedule(() => githubAxios.get(path, { params }).then((r) => r.data));
}

/**
 * Make a single GET request for raw file bytes and return the full Axios response.
 * Uses the raw media type so large files are not subject to the base64 JSON size limit.
 *
 * @param {string} path - API path
 * @param {object} [params={}] - Query parameters
 * @returns {Promise<import('axios').AxiosResponse>} Full response object
 */
export async function getRaw(path, params = {}) {
  return limiter.schedule(() =>
    githubAxios.get(path, {
      params,
      responseType: 'arraybuffer',
      headers: { Accept: 'application/vnd.github.raw+json' },
    }),
  );
}

/**
 * Extract the next page number from a Link header, if any.
 * Only the page number is used (never the absolute URL) so the token is never
 * sent to a host other than the configured API base URL.
 */
function nextPageFromLink(link) {
  const match = /<([^>]+)>;\s*rel="next"/.exec(link || '');
  if (!match) return null;
  return new URL(match[1]).searchParams.get('page');
}

/**
 * Make a GET request with automatic Link-header pagination.
 * Fetches all pages sequentially and concatenates results.
 *
 * @param {string} path - API path
 * @param {object} [params={}] - Query parameters
 * @param {string} [itemsKey] - Wrapper key holding the array (e.g. "check_runs")
 * @returns {Promise<Array>} Concatenated array from all pages
 */
export async function getAll(path, params = {}, itemsKey) {
  const perPage = Math.min(params.per_page || 100, 100);
  const results = [];
  let page = 1;

  while (page) {
    const response = await limiter.schedule(() =>
      githubAxios.get(path, { params: { ...params, per_page: perPage, page } }),
    );
    results.push(...(itemsKey ? response.data[itemsKey] : response.data));
    page = nextPageFromLink(response.headers?.link);
  }

  return results;
}
