import { describe, it, expect } from '@jest/globals';
import { ALL_TOOLS } from '../src/schemas/toolSchemas.js';

describe('tool registration', () => {
  it('registers all Technical Lead tools with their required inputs', () => {
    const tools = Object.fromEntries(ALL_TOOLS.map((tool) => [tool.name, tool]));
    expect(tools.inspect_sql_attachment.inputSchema.required).toEqual(['issueKey', 'attachmentId']);
    expect(tools.download_attachment.inputSchema.required).toEqual(['issueKey', 'attachmentId']);
    expect(tools.compare_sql_attachments.inputSchema.required).toHaveLength(4);
    expect(tools.get_team_workload_summary.inputSchema.required).toEqual(expect.arrayContaining(['accountIds', 'timezone', 'dailyThresholdHours', 'weeklyThresholdHours']));
  });
});
