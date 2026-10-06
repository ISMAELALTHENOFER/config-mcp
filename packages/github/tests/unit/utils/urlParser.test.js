import { describe, it, expect } from '@jest/globals';
import { parsePullRequestUrl, parseRepository } from '../../../src/utils/urlParser.js';
import { ValidationError } from '@config-mcp/mcp-core';

describe('utils/urlParser', () => {
  describe('parsePullRequestUrl', () => {
    it('should parse a standard github.com PR URL', () => {
      expect(parsePullRequestUrl('https://github.com/octo/project/pull/42')).toEqual({
        repository: 'octo/project',
        pullNumber: 42,
      });
    });

    it('should parse a GitHub Enterprise URL', () => {
      expect(parsePullRequestUrl('https://ghe.example.com/octo/project/pull/7')).toEqual({
        repository: 'octo/project',
        pullNumber: 7,
      });
    });

    it('should parse PR URLs with sub-pages, query and hash', () => {
      expect(
        parsePullRequestUrl('https://github.com/octo/project/pull/42/files?w=1#diff-abc'),
      ).toEqual({ repository: 'octo/project', pullNumber: 42 });
    });

    it('should reject a non-PR URL (issues)', () => {
      expect(() =>
        parsePullRequestUrl('https://github.com/octo/project/issues/42'),
      ).toThrow(ValidationError);
    });

    it('should reject a URL with non-numeric or non-positive PR number', () => {
      expect(() =>
        parsePullRequestUrl('https://github.com/octo/project/pull/abc'),
      ).toThrow(ValidationError);
      expect(() => parsePullRequestUrl('https://github.com/octo/project/pull/0')).toThrow(
        ValidationError,
      );
    });

    it('should reject invalid or empty input', () => {
      expect(() => parsePullRequestUrl('not-a-url')).toThrow(ValidationError);
      expect(() => parsePullRequestUrl('')).toThrow(ValidationError);
      expect(() => parsePullRequestUrl(undefined)).toThrow(ValidationError);
    });

    it('should reject a repository URL without pull segment', () => {
      expect(() => parsePullRequestUrl('https://github.com/octo/project')).toThrow(
        ValidationError,
      );
    });
  });

  describe('parseRepository', () => {
    it('should parse owner/repo', () => {
      expect(parseRepository('octo/project')).toEqual({ owner: 'octo', repo: 'project' });
    });

    it('should parse a github.com repository URL', () => {
      expect(parseRepository('https://github.com/octo/project')).toEqual({
        owner: 'octo',
        repo: 'project',
      });
    });

    it('should parse URLs with .git suffix and extra path', () => {
      expect(parseRepository('https://github.com/octo/project.git')).toEqual({
        owner: 'octo',
        repo: 'project',
      });
      expect(parseRepository('https://github.com/octo/project/pull/42')).toEqual({
        owner: 'octo',
        repo: 'project',
      });
    });

    it('should allow dots, dashes and underscores in names', () => {
      expect(parseRepository('my-org/my_repo.js')).toEqual({
        owner: 'my-org',
        repo: 'my_repo.js',
      });
    });

    it('should reject malformed repositories', () => {
      for (const bad of [
        '',
        'project',
        'a/b/c',
        '/project',
        'octo/',
        'octo/..',
        '../project',
        'octo/pro ject',
        'octo/pro?ject',
      ]) {
        expect(() => parseRepository(bad)).toThrow(ValidationError);
      }
      expect(() => parseRepository(undefined)).toThrow(ValidationError);
    });

    it('should reject URLs without owner and repo', () => {
      expect(() => parseRepository('https://github.com/octo')).toThrow(ValidationError);
    });
  });
});
