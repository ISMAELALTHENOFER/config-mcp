import { describe, it, expect } from '@jest/globals';
import {
  mapIssue,
  mapIssueDetail,
  mapSearchResults,
  mapProject,
  mapBoard,
  mapSprint,
  mapVersion,
} from '../src/jira/jiraMapper.js';

describe('jiraMapper', () => {
  describe('mapIssue', () => {
    it('should map a basic issue correctly', () => {
      const raw = {
        key: 'TEST-123',
        fields: {
          summary: 'Test issue',
          status: { name: 'In Progress', statusCategory: { name: 'In Progress' } },
          assignee: { accountId: 'abc', displayName: 'John Doe', emailAddress: 'john@test.com' },
          priority: { name: 'High' },
          issuetype: { name: 'Bug' },
          created: '2026-01-01T00:00:00.000Z',
          updated: '2026-01-02T00:00:00.000Z',
          duedate: '2026-01-15',
          project: { key: 'TEST', name: 'Test Project' },
          labels: ['frontend'],
          fixVersions: [{ id: '1', name: 'v1.0', released: false }],
        },
      };

      const result = mapIssue(raw);
      expect(result.key).toBe('TEST-123');
      expect(result.summary).toBe('Test issue');
      expect(result.status).toBe('In Progress');
      expect(result.statusCategory).toBe('inProgress');
      expect(result.assignee.displayName).toBe('John Doe');
      expect(result.priority).toBe('High');
      expect(result.issueType).toBe('Bug');
      expect(result.project.key).toBe('TEST');
    });

    it('should handle null assignee', () => {
      const raw = {
        key: 'TEST-124',
        fields: { summary: 'No assignee', status: { name: 'Open' } },
      };
      const result = mapIssue(raw);
      expect(result.assignee).toBeNull();
    });
  });

  describe('mapIssueDetail', () => {
    it('should map subtasks and parent', () => {
      const raw = {
        key: 'TEST-123',
        fields: {
          summary: 'Parent issue',
          status: { name: 'Open' },
          description: 'Description text',
          components: [{ id: '1', name: 'Component A' }],
          subtasks: [
            { key: 'TEST-124', fields: { summary: 'Subtask', status: { name: 'Done' } } },
          ],
          parent: { key: 'TEST-100', fields: { summary: 'Epic' } },
          customfield_10014: 'TEST-100',
        },
      };

      const result = mapIssueDetail(raw);
      expect(result.description).toBe('Description text');
      expect(result.components).toHaveLength(1);
      expect(result.subtasks).toHaveLength(1);
      expect(result.subtasks[0].key).toBe('TEST-124');
      expect(result.parent.key).toBe('TEST-100');
      expect(result.epic.key).toBe('TEST-100');
    });
  });

  describe('mapSearchResults', () => {
    it('should map search results with issues', () => {
      const raw = {
        total: 1,
        maxResults: 50,
        startAt: 0,
        issues: [
          {
            key: 'TEST-1',
            fields: { summary: 'First', status: { name: 'Done', statusCategory: { name: 'Done' } } },
          },
        ],
      };

      const result = mapSearchResults(raw);
      expect(result.total).toBe(1);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].key).toBe('TEST-1');
    });

    it('should handle empty results', () => {
      const raw = { total: 0, maxResults: 50, startAt: 0 };
      const result = mapSearchResults(raw);
      expect(result.total).toBe(0);
      expect(result.issues).toEqual([]);
    });
  });

  describe('mapProject', () => {
    it('should map project correctly', () => {
      const raw = {
        key: 'TEST',
        name: 'Test Project',
        description: 'A test project',
        lead: { displayName: 'John Doe' },
        self: 'https://jira.example.com/rest/api/3/project/TEST',
        avatarUrls: { '48x48': 'https://avatar.url' },
        projectCategory: { name: 'Software' },
      };

      const result = mapProject(raw);
      expect(result.key).toBe('TEST');
      expect(result.name).toBe('Test Project');
      expect(result.lead).toBe('John Doe');
      expect(result.projectCategory).toBe('Software');
    });
  });

  describe('mapBoard', () => {
    it('should map board correctly', () => {
      const raw = {
        id: 1,
        name: 'Scrum Board',
        type: 'scrum',
        location: { projectKey: 'TEST', projectName: 'Test' },
      };
      const result = mapBoard(raw);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Scrum Board');
      expect(result.type).toBe('scrum');
    });
  });

  describe('mapSprint', () => {
    it('should map sprint correctly', () => {
      const raw = {
        id: 1,
        name: 'Sprint 1',
        state: 'active',
        startDate: '2026-01-01',
        endDate: '2026-01-14',
        originBoardId: 1,
        goal: 'Complete tasks',
      };
      const result = mapSprint(raw);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Sprint 1');
      expect(result.state).toBe('active');
    });
  });

  describe('mapVersion', () => {
    it('should map version correctly', () => {
      const raw = {
        id: '1',
        name: 'v1.0',
        description: 'First release',
        released: true,
        releaseDate: '2026-01-01',
        overdue: false,
        project: 'TEST',
      };
      const result = mapVersion(raw);
      expect(result.name).toBe('v1.0');
      expect(result.released).toBe(true);
    });
  });
});
