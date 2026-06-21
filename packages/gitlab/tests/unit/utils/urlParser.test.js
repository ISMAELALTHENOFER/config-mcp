import { describe, it, expect } from '@jest/globals';
import { parseMrUrl, encodeProjectPath } from '../../../src/utils/urlParser.js';
import { ValidationError } from '@config-mcp/mcp-core';

describe('utils/urlParser', () => {
  describe('parseMrUrl', () => {
    it('should parse a standard gitlab.com MR URL', () => {
      const result = parseMrUrl('https://gitlab.com/group/project/-/merge_requests/42');
      expect(result).toEqual({ projectPath: 'group/project', mrIid: 42 });
    });

    it('should parse a self-hosted URL with subgroups', () => {
      const result = parseMrUrl(
        'https://gitlab.example.com/group/subgroup/project/-/merge_requests/7',
      );
      expect(result).toEqual({ projectPath: 'group/subgroup/project', mrIid: 7 });
    });

    it('should parse a URL with query parameters', () => {
      const result = parseMrUrl(
        'https://gitlab.com/group/project/-/merge_requests/42?foo=bar',
      );
      expect(result).toEqual({ projectPath: 'group/project', mrIid: 42 });
    });

    it('should parse an HTTP localhost URL', () => {
      const result = parseMrUrl('http://localhost:8080/group/project/-/merge_requests/1');
      expect(result).toEqual({ projectPath: 'group/project', mrIid: 1 });
    });

    it('should reject a non-MR URL (issues)', () => {
      expect(() => {
        parseMrUrl('https://gitlab.com/group/project/-/issues/42');
      }).toThrow(ValidationError);
    });

    it('should reject a URL with non-numeric MR IID', () => {
      expect(() => {
        parseMrUrl('https://gitlab.com/group/project/-/merge_requests/abc');
      }).toThrow(ValidationError);
    });

    it('should reject a completely invalid URL', () => {
      expect(() => {
        parseMrUrl('not-a-url');
      }).toThrow(ValidationError);
    });

    it('should reject an empty string', () => {
      expect(() => {
        parseMrUrl('');
      }).toThrow(ValidationError);
    });

    it('should reject a URL without merge_requests segment', () => {
      expect(() => {
        parseMrUrl('https://gitlab.com/group/project');
      }).toThrow(ValidationError);
    });

    it('should reject a URL with negative MR IID', () => {
      expect(() => {
        parseMrUrl('https://gitlab.com/group/project/-/merge_requests/-1');
      }).toThrow(ValidationError);
    });

    it('should parse a URL with deeply nested subgroups', () => {
      const result = parseMrUrl(
        'https://gitlab.com/group/sub1/sub2/sub3/project/-/merge_requests/99',
      );
      expect(result).toEqual({ projectPath: 'group/sub1/sub2/sub3/project', mrIid: 99 });
    });
  });

  describe('encodeProjectPath', () => {
    it('should encode a simple project path', () => {
      const result = encodeProjectPath('group/project');
      expect(result).toBe('group%2Fproject');
    });

    it('should encode a nested project path with subgroups', () => {
      const result = encodeProjectPath('group/subgroup/project');
      expect(result).toBe('group%2Fsubgroup%2Fproject');
    });

    it('should encode a deeply nested project path', () => {
      const result = encodeProjectPath('group/sub1/sub2/project');
      expect(result).toBe('group%2Fsub1%2Fsub2%2Fproject');
    });

    it('should handle a single-segment path (no slashes)', () => {
      const result = encodeProjectPath('project');
      expect(result).toBe('project');
    });

    it('should not double-encode already encoded paths', () => {
      const result = encodeProjectPath('group%2Fproject');
      expect(result).toBe('group%2Fproject');
    });
  });
});
