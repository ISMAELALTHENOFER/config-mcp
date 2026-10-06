import { describe, it, expect } from '@jest/globals';
import { ALL_TOOLS } from '../../../src/schemas/toolSchemas.js';

describe('schemas/toolSchemas', () => {
  it('should register the 9 read-only tools with unique names', () => {
    const names = ALL_TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(9);
    expect(names.sort()).toEqual([
      'get_file_content',
      'get_pull_request',
      'get_pull_request_checks',
      'get_pull_request_comments',
      'get_pull_request_files',
      'get_pull_request_reviews',
      'get_repository',
      'list_branches',
      'list_pull_requests',
    ]);
  });

  it('should describe every tool with an object input schema', () => {
    for (const tool of ALL_TOOLS) {
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema.type).toBe('object');
      for (const key of tool.inputSchema.required ?? []) {
        expect(tool.inputSchema.properties).toHaveProperty(key);
      }
    }
  });

  it('should require repository + pullNumber on the pull request detail tools', () => {
    for (const name of [
      'get_pull_request_files',
      'get_pull_request_comments',
      'get_pull_request_reviews',
      'get_pull_request_checks',
    ]) {
      const tool = ALL_TOOLS.find((t) => t.name === name);
      expect(tool.inputSchema.required).toEqual(['repository', 'pullNumber']);
    }
  });

  it('should keep get_pull_request flexible (url or repository + pullNumber)', () => {
    const tool = ALL_TOOLS.find((t) => t.name === 'get_pull_request');
    expect(tool.inputSchema.required).toBeUndefined();
    expect(Object.keys(tool.inputSchema.properties)).toEqual([
      'url',
      'repository',
      'pullNumber',
    ]);
  });

  it('should expose the merged state on list_pull_requests', () => {
    const tool = ALL_TOOLS.find((t) => t.name === 'list_pull_requests');
    expect(tool.inputSchema.properties.state.enum).toEqual([
      'open',
      'closed',
      'merged',
      'all',
    ]);
  });
});
