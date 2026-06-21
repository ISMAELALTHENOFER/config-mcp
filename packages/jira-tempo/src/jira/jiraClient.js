import axios from 'axios';
import { env } from '../config/env.js';
import { limiter } from '@config-mcp/mcp-core';
import { logger } from '../utils/logger.js';

const jiraAxios = axios.create({
  baseURL: env.JIRA_BASE_URL,
  headers: {
    Authorization: `Basic ${Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`).toString('base64')}`,
    Accept: 'application/json',
  },
  timeout: 30000,
});

jiraAxios.interceptors.request.use((config) => {
  logger.debug('Jira API request', {
    method: config.method,
    url: config.url,
  });
  return config;
});

jiraAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      throw new Error('Jira authentication failed. Check credentials.');
    }
    if (status === 404) {
      throw new Error('Jira resource not found.');
    }
    if (status === 429) {
      throw new Error('Jira rate limit exceeded. Try again later.');
    }

    throw new Error(
      data?.errorMessages?.[0] || data?.message || `Jira request failed (${status})`,
    );
  },
);

export async function jiraGet(url, params = {}) {
  return limiter.schedule(() =>
    jiraAxios.get(url, { params }).then((r) => r.data),
  );
}

export async function jiraPost(url, data = {}) {
  return limiter.schedule(() =>
    jiraAxios.post(url, data).then((r) => r.data),
  );
}

export { jiraAxios };
