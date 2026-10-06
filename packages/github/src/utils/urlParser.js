import { ValidationError } from '@config-mcp/mcp-core';

const NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

function isValidName(name) {
  return NAME_PATTERN.test(name) && name !== '.' && name !== '..';
}

/**
 * Parse a GitHub pull request URL into repository and pull request number.
 *
 * Pattern: {host}/{owner}/{repo}/pull/{number}[/files|/commits|...]
 * Works for github.com and GitHub Enterprise Server hosts.
 *
 * @param {string} url - Full GitHub pull request URL
 * @returns {{ repository: string, pullNumber: number }}
 * @throws {ValidationError} If URL is invalid or not a pull request URL
 */
export function parsePullRequestUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL is required');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ValidationError('Invalid GitHub pull request URL');
  }

  const [owner, repo, segment, number] = parsedUrl.pathname.split('/').filter(Boolean);

  if (!owner || !repo || segment !== 'pull') {
    throw new ValidationError('URL is not a pull request');
  }

  const pullNumber = Number(number);

  if (!Number.isInteger(pullNumber) || pullNumber <= 0) {
    throw new ValidationError('Pull request number must be a positive integer');
  }

  return { repository: `${owner}/${repo}`, pullNumber };
}

/**
 * Parse a repository reference into owner and repo.
 *
 * Accepts "owner/repo" or any GitHub URL that starts with /{owner}/{repo}
 * (e.g. https://github.com/owner/repo, .../repo.git, .../repo/pull/42).
 *
 * @param {string} input - Repository reference
 * @returns {{ owner: string, repo: string }}
 * @throws {ValidationError} If the reference is malformed
 */
export function parseRepository(input) {
  if (!input || typeof input !== 'string') {
    throw new ValidationError('Repository is required');
  }

  let segments;
  if (/^https?:\/\//i.test(input)) {
    try {
      segments = new URL(input).pathname.split('/').filter(Boolean).slice(0, 2);
    } catch {
      throw new ValidationError('Invalid GitHub repository URL');
    }
  } else {
    segments = input.split('/');
  }

  if (segments.length !== 2) {
    throw new ValidationError('Repository must be in "owner/repo" format');
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/, '');

  if (!isValidName(owner) || !isValidName(repo)) {
    throw new ValidationError('Repository must be in "owner/repo" format');
  }

  return { owner, repo };
}
