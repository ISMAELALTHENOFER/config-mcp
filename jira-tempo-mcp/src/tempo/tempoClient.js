import axios from 'axios';
import { env } from '../config/env.js';
import { limiter } from '../middleware/rateLimit.js';
import { logger } from '../utils/logger.js';

const tempoAxios = axios.create({
  baseURL: 'https://api.tempo.io/4',
  headers: {
    Authorization: `Bearer ${env.TEMPO_API_TOKEN}`,
    Accept: 'application/json',
  },
  timeout: 30000,
});

tempoAxios.interceptors.request.use((config) => {
  logger.debug('Tempo API request', {
    method: config.method,
    url: config.url,
  });
  return config;
});

tempoAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      throw new Error('Tempo authentication failed. Check API token.');
    }
    if (status === 404) {
      throw new Error('Tempo resource not found.');
    }
    if (status === 429) {
      throw new Error('Tempo rate limit exceeded. Try again later.');
    }

    throw new Error(
      data?.message || `Tempo request failed (${status})`,
    );
  },
);

export async function tempoGet(url, params = {}) {
  return limiter.schedule(() =>
    tempoAxios.get(url, { params }).then((r) => r.data),
  );
}

export { tempoAxios };
