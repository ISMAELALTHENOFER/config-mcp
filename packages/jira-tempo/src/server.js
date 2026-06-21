import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { ALL_TOOLS } from './schemas/toolSchemas.js';
import { createRateLimitMiddleware } from '@config-mcp/mcp-core';

import { handleSearchJql } from './tools/searchJql.js';
import { handleGetIssue } from './tools/getIssue.js';
import { handleGetProject } from './tools/getProject.js';
import { handleGetEpic } from './tools/getEpic.js';
import { handleGetSprint } from './tools/getSprint.js';
import { handleGetBoard } from './tools/getBoard.js';
import { handleGetRelease } from './tools/getRelease.js';
import { handleGetMyTasks } from './tools/getMyTasks.js';
import { handleGetBlockedIssues } from './tools/getBlockedIssues.js';
import { handleGetProjectMetrics } from './tools/getProjectMetrics.js';
import { handleGetEpicProgress } from './tools/getEpicProgress.js';
import { handleGetTempoWorklogs } from './tools/getTempoWorklogs.js';
import { handleGetTempoUserHours } from './tools/getTempoUserHours.js';
import { handleGetTempoProjectHours } from './tools/getTempoProjectHours.js';
import { handleGetTempoTeamHours } from './tools/getTempoTeamHours.js';
import { handleGetTempoIssueHours } from './tools/getTempoIssueHours.js';
import { handleGetIssueComments } from './tools/getIssueComments.js';

const TOOL_HANDLERS = {
  search_jql: handleSearchJql,
  get_issue: handleGetIssue,
  get_project: handleGetProject,
  get_epic: handleGetEpic,
  get_sprint: handleGetSprint,
  get_board: handleGetBoard,
  get_release: handleGetRelease,
  get_my_tasks: handleGetMyTasks,
  get_blocked_issues: handleGetBlockedIssues,
  get_project_metrics: handleGetProjectMetrics,
  get_epic_progress: handleGetEpicProgress,
  get_tempo_worklogs: handleGetTempoWorklogs,
  get_tempo_user_hours: handleGetTempoUserHours,
  get_tempo_project_hours: handleGetTempoProjectHours,
  get_tempo_team_hours: handleGetTempoTeamHours,
  get_tempo_issue_hours: handleGetTempoIssueHours,
  get_issue_comments: handleGetIssueComments,
};

const rateLimitMiddleware = createRateLimitMiddleware(200);

const server = new Server(
  {
    name: 'jira-tempo',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info('Listing available tools');
  return { tools: ALL_TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();
  const { name, arguments: args } = request.params;

  logger.info('Tool called', { tool: name });

  try {
    const handler = TOOL_HANDLERS[name];
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const result = await rateLimitMiddleware.handler(request, () =>
      handler(args),
    );

    const duration = Date.now() - startTime;
    logger.info('Tool completed', { tool: name, duration, success: true });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Tool failed', {
      tool: name,
      duration,
      success: false,
      error: error.message,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              message: error.message || 'An unexpected error occurred',
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Jira Tempo Server running', {
      port: env.MCP_PORT,
      level: env.MCP_LOG_LEVEL,
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

main();
