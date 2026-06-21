import { describe, it, expect } from '@jest/globals';
import { schemas, validate } from '../src/middleware/validation.js';

describe('validation', () => {
  describe('issueKey', () => {
    it('should accept valid issue keys', () => {
      const valid = validate(schemas.issueKey, { issueKey: 'TEST-123' });
      expect(valid.issueKey).toBe('TEST-123');
    });

    it('should reject invalid issue keys', () => {
      expect(() => validate(schemas.issueKey, { issueKey: 'test-123' })).toThrow();
      expect(() => validate(schemas.issueKey, { issueKey: '123-TEST' })).toThrow();
      expect(() => validate(schemas.issueKey, { issueKey: '' })).toThrow();
    });
  });

  describe('projectKey', () => {
    it('should accept valid project keys', () => {
      const valid = validate(schemas.projectKey, { projectKey: 'TEST' });
      expect(valid.projectKey).toBe('TEST');
    });

    it('should reject invalid project keys', () => {
      expect(() => validate(schemas.projectKey, { projectKey: 'test' })).toThrow();
      expect(() => validate(schemas.projectKey, { projectKey: '' })).toThrow();
    });
  });

  describe('sprintId', () => {
    it('should accept positive integers', () => {
      const valid = validate(schemas.sprintId, { sprintId: 1 });
      expect(valid.sprintId).toBe(1);
    });

    it('should reject non-positive', () => {
      expect(() => validate(schemas.sprintId, { sprintId: 0 })).toThrow();
      expect(() => validate(schemas.sprintId, { sprintId: -1 })).toThrow();
    });
  });

  describe('boardId', () => {
    it('should accept positive board id', () => {
      const valid = validate(schemas.boardId, { boardId: 5 });
      expect(valid.boardId).toBe(5);
    });
  });

  describe('jql', () => {
    it('should accept valid JQL', () => {
      const valid = validate(schemas.jql, { jql: 'project = TEST ORDER BY updated DESC' });
      expect(valid.jql).toBe('project = TEST ORDER BY updated DESC');
    });

    it('should reject empty JQL', () => {
      expect(() => validate(schemas.jql, { jql: '' })).toThrow();
    });
  });

  describe('dateRange', () => {
    it('should accept valid dates', () => {
      const valid = validate(schemas.dateRange, { from: '2026-01-01', to: '2026-01-31' });
      expect(valid.from).toBe('2026-01-01');
      expect(valid.to).toBe('2026-01-31');
    });

    it('should reject invalid dates', () => {
      expect(() => validate(schemas.dateRange, { from: '01-01-2026', to: '2026-01-31' })).toThrow();
      expect(() => validate(schemas.dateRange, { from: '2026/01/01', to: '2026-01-31' })).toThrow();
    });
  });
});
