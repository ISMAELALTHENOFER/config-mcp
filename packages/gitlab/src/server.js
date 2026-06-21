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

import { handleGetMr } from './tools/getMr.js';
import { handleGetMrDiffs } from './tools/getMrDiffs.js';
import { handleGetMrComments } from './tools/getMrComments.js';
import { handleGetMrApprovals } from './tools/getMrApprovals.js';
import { handleGetMrPipelines } from './tools/getMrPipelines.js';
import { handleListProjectMrs } from './tools/listProjectMrs.js';
import { handleGetProject } from './tools/getProject.js';
import { handleListBranches } from './tools/listBranches.js';
import { handleGetFileContent } from './tools/getFileContent.js';

const TOOL_HANDLERS = {
  get_mr: handleGetMr,
  get_mr_diffs: handleGetMrDiffs,
  get_mr_comments: handleGetMrComments,
  get_mr_approvals: handleGetMrApprovals,
  get_mr_pipelines: handleGetMrPipelines,
  list_project_mrs: handleListProjectMrs,
  get_project: handleGetProject,
  list_branches: handleListBranches,
  get_file_content: handleGetFileContent,
};

const rateLimitMiddleware = createRateLimitMiddleware(100);

const server = new Server(
  {
    name: 'gitlab',
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
    logger.info('GitLab Server running', {
      port: env.MCP_PORT,
      level: env.MCP_LOG_LEVEL,
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

main();
