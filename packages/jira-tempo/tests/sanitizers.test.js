import { describe, it, expect } from '@jest/globals';
import {
  sanitizeHeaders,
  sanitizeUrl,
  sanitizeConfig,
} from '@config-mcp/mcp-core';

describe('sanitizers', () => {
  describe('sanitizeHeaders', () => {
    it('should redact sensitive headers', () => {
      const headers = {
        Authorization: 'Bearer token123',
        'Content-Type': 'application/json',
        'X-API-Key': 'secret-key',
      };
      const result = sanitizeHeaders(headers);
      expect(result.Authorization).toBe('***REDACTED***');
      expect(result['X-API-Key']).toBe('***REDACTED***');
      expect(result['Content-Type']).toBe('application/json');
    });
  });

  describe('sanitizeUrl', () => {
    it('should redact credentials in URL', () => {
      const url = 'https://user:password@jira.example.com/rest/api/3/search';
      const result = sanitizeUrl(url);
      expect(result).not.toContain('password');
      expect(result).not.toContain('user');
      expect(result).toContain('***REDACTED***');
    });

    it('should return original URL if parsing fails', () => {
      const url = 'not-a-valid-url';
      expect(sanitizeUrl(url)).toBe(url);
    });
  });

  describe('sanitizeConfig', () => {
    it('should redact all sensitive config values', () => {
      const config = {
        JIRA_BASE_URL: 'https://jira.example.com',
        JIRA_API_TOKEN: 'supersecret',
        TEMPO_API_TOKEN: 'anothersecret',
        JIRA_EMAIL: 'user@example.com',
        MCP_PORT: 3000,
      };
      const result = sanitizeConfig(config);
      expect(result.JIRA_API_TOKEN).toBe('***REDACTED***');
      expect(result.TEMPO_API_TOKEN).toBe('***REDACTED***');
      expect(result.JIRA_EMAIL).toBe('***REDACTED***');
      expect(result.JIRA_BASE_URL).toBe('https://jira.example.com');
    });
  });
});
