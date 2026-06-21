import { sanitizeHeaders } from '../utils/sanitizers.js';

export function createSecurityMiddleware() {
  return {
    name: 'security',
    async handler(request, next) {
      if (request.params?.headers) {
        request.params.headers = sanitizeHeaders(request.params.headers);
      }

      if (request.params?._rawResponse) {
        const body =
          typeof request.params._rawResponse === 'string'
            ? request.params._rawResponse
            : JSON.stringify(request.params._rawResponse);

        const sensitiveKeys = [
          '"apiToken"',
          '"api_token"',
          '"API_TOKEN"',
          '"token"',
          '"TOKEN"',
          '"password"',
          '"PASSWORD"',
          '"secret"',
          '"SECRET"',
          '"authorization"',
          '"Authorization"',
        ];

        for (const key of sensitiveKeys) {
          const regex = new RegExp(`${key}\\s*:\\s*"[^"]+"`, 'g');
          if (regex.test(body)) {
            throw new Error(
              'Lo siento, la informacion sensible del sistema no esta disponible.',
            );
          }
        }
      }

      return next();
    },
  };
}

/**
 * Redact sensitive credential values from a config object.
 * Returns a new object with known credential keys replaced.
 */
export function redactCredentials(config) {
  const sensitiveKeys = [
    'apiToken',
    'api_token',
    'API_TOKEN',
    'token',
    'TOKEN',
    'password',
    'PASSWORD',
    'secret',
    'SECRET',
    'authorization',
    'Authorization',
    'apiKey',
    'API_KEY',
    'api_key',
  ];

  if (!config || typeof config !== 'object') return config;

  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      if (sensitiveKeys.includes(key)) {
        return [key, '***REDACTED***'];
      }
      if (typeof value === 'object' && value !== null) {
        return [key, redactCredentials(value)];
      }
      return [key, value];
    }),
  );
}
