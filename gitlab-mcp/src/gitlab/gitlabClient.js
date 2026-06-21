import axios from 'axios';
import { env } from '../config/env.js';
import { limiter } from '../middleware/rateLimit.js';
import { logger } from '../utils/logger.js';
import { GitlabError } from '../utils/errors.js';

const gitlabAxios = axios.create({
  baseURL: `${env.GITLAB_BASE_URL}/api/v4`,
  headers: {
    'PRIVATE-TOKEN': env.GITLAB_PERSONAL_ACCESS_TOKEN,
    Accept: 'application/json',
  },
  timeout: 30000,
});

gitlabAxios.interceptors.request.use((config) => {
  logger.debug('GitLab API request', {
    method: config.method,
    url: config.url,
  });
  return config;
});

gitlabAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error, DNS failure, timeout, etc.
      throw error;
    }

    const status = error.response.status;

    switch (status) {
      case 401:
        throw new GitlabError(
          'GitLab authentication failed. Check your personal access token.',
          401,
        );
      case 403:
        throw new GitlabError(
          'GitLab access denied. Token lacks permissions for this resource.',
          403,
        );
      case 404:
        throw new GitlabError('GitLab resource not found.', 404);
      case 429:
        throw new GitlabError(
          'GitLab rate limit exceeded. Try again later.',
          429,
        );
      default:
        throw new GitlabError(
          `GitLab request failed (${status})`,
          status,
        );
    }
  },
);

/**
 * Make a single GET request to the GitLab API.
 * Returns the response data (JSON body).
 *
 * @param {string} path - API path (e.g., "/projects/1/merge_requests")
 * @param {object} [params={}] - Query parameters
 * @returns {Promise<object>} Response data
 */
export async function get(path, params = {}) {
  return limiter.schedule(() =>
    gitlabAxios.get(path, { params }).then((r) => r.data),
  );
}

/**
 * Make a single GET request and return the full Axios response.
 * Use this when you need response headers or metadata (e.g., raw file content).
 *
 * @param {string} path - API path
 * @param {object} [params={}] - Query parameters
 * @returns {Promise<import('axios').AxiosResponse>} Full response object
 */
export async function getRaw(path, params = {}) {
  return limiter.schedule(() =>
    gitlabAxios.get(path, { params }),
  );
}

/**
 * Make a GET request with automatic pagination.
 * Fetches all pages and concatenates results.
 *
 * @param {string} path - API path
 * @param {object} [params={}] - Query parameters
 * @returns {Promise<Array>} Concatenated array from all pages
 */
export async function getAll(path, params = {}) {
  const perPage = Math.min(params.per_page || 100, 100);
  const results = [];

  // Fetch first page
  const firstResponse = await limiter.schedule(() =>
    gitlabAxios.get(path, {
      params: { ...params, per_page: perPage, page: 1 },
    }),
  );

  results.push(...firstResponse.data);

  // Determine total pages from response headers
  const totalPages = parseInt(
    firstResponse.headers['x-total-pages'] || '1',
    10,
  );

  // Fetch remaining pages in parallel (Bottleneck will limit concurrency)
  if (totalPages > 1) {
    const pagePromises = [];
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(
        limiter.schedule(() =>
          gitlabAxios.get(path, {
            params: { ...params, per_page: perPage, page },
          }),
        ),
      );
    }

    const remainingResponses = await Promise.all(pagePromises);
    for (const response of remainingResponses) {
      results.push(...response.data);
    }
  }

  return results;
}
