const SENSITIVE_PATTERNS = [
  /(api[_-]?key|api[_-]?token|password|secret|token|credential)/gi,
  /(auth[_-]?header|authorization|cookie)/gi,
];

export function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_PATTERNS.some((p) => p.test(key))) {
      sanitized[key] = '***REDACTED***';
    }
  }
  return sanitized;
}

export function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***REDACTED***';
    }
    if (parsed.username) {
      parsed.username = '***REDACTED***';
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function sanitizeError(error) {
  return {
    message: error.message,
    statusCode: error.statusCode || 500,
  };
}

export function sanitizeConfig(config) {
  return {
    ...config,
    JIRA_API_TOKEN: '***REDACTED***',
    TEMPO_API_TOKEN: '***REDACTED***',
    JIRA_EMAIL: '***REDACTED***',
  };
}
