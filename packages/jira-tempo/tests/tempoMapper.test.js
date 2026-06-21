import { describe, it, expect } from '@jest/globals';
import {
  mapWorklog,
  mapWorklogsResponse,
  aggregateHours,
} from '../src/tempo/tempoMapper.js';

describe('tempoMapper', () => {
  describe('mapWorklog', () => {
    it('should map a worklog correctly', () => {
      const raw = {
        id: 123,
        issue: { id: '456', key: 'TEST-1', summary: 'Test issue' },
        timeSpentSeconds: 3600,
        description: 'Work description',
        author: { accountId: 'abc', displayName: 'John Doe' },
        startDate: '2026-01-01',
        startTime: '09:00:00',
        createdAt: '2026-01-01T09:00:00Z',
        updatedAt: '2026-01-01T09:00:00Z',
      };

      const result = mapWorklog(raw);
      expect(result.id).toBe(123);
      expect(result.issueKey).toBe('TEST-1');
      expect(result.timeSpentSeconds).toBe(3600);
      expect(result.timeSpent).toBe('1h');
      expect(result.author.displayName).toBe('John Doe');
    });

    it('should handle missing issue data', () => {
      const raw = {
        id: 123,
        timeSpentSeconds: 7200,
        startDate: '2026-01-01',
      };
      const result = mapWorklog(raw);
      expect(result.issueKey).toBeNull();
      expect(result.timeSpent).toBe('2h');
    });
  });

  describe('mapWorklogsResponse', () => {
    it('should map worklogs response', () => {
      const raw = {
        metadata: { count: 1 },
        results: [
          {
            id: 1,
            timeSpentSeconds: 3600,
            startDate: '2026-01-01',
          },
        ],
      };
      const result = mapWorklogsResponse(raw);
      expect(result.total).toBe(1);
      expect(result.worklogs).toHaveLength(1);
    });
  });

  describe('aggregateHours', () => {
    it('should aggregate hours correctly', () => {
      const worklogs = [
        { timeSpentSeconds: 3600 },
        { timeSpentSeconds: 7200 },
        { timeSpentSeconds: 1800 },
      ];
      const result = aggregateHours(worklogs);
      expect(result.totalSeconds).toBe(12600);
      expect(result.worklogCount).toBe(3);
      expect(result.formatted).toBe('3h 30m');
    });

    it('should handle empty array', () => {
      const result = aggregateHours([]);
      expect(result.totalSeconds).toBe(0);
      expect(result.formatted).toBe('0h');
      expect(result.worklogCount).toBe(0);
    });
  });
});
