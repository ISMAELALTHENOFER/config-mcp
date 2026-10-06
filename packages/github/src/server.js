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

import { handleGetRepository } from './tools/getRepository.js';
import { handleListPullRequests } from './tools/listPullRequests.js';
import { handleGetPullRequest } from './tools/getPullRequest.js';
import { handleGetPullRequestFiles } from './tools/getPullRequestFiles.js';
import { handleGetPullRequestComments } from './tools/getPullRequestComments.js';
import { handleGetPullRequestReviews } from './tools/getPullRequestReviews.js';
import { handleGetPullRequestChecks } from './tools/getPullRequestChecks.js';
import { handleListBranches } from './tools/listBranches.js';
import { handleGetFileContent } from './tools/getFileContent.js';

const TOOL_HANDLERS = {
  get_repository: handleGetRepository,
  list_pull_requests: handleListPullRequests,
  get_pull_request: handleGetPullRequest,
  get_pull_request_files: handleGetPullRequestFiles,
  get_pull_request_comments: handleGetPullRequestComments,
  get_pull_request_reviews: handleGetPullRequestReviews,
  get_pull_request_checks: handleGetPullRequestChecks,
  list_branches: handleListBranches,
  get_file_content: handleGetFileContent,
};

const rateLimitMiddleware = createRateLimitMiddleware(100);

const server = new Server(
  {
    name: 'github',
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

    const result = await rateLimitMiddleware.handler(request, () => handler(args));

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
    logger.info('GitHub Server running', {
      port: env.MCP_PORT,
      level: env.MCP_LOG_LEVEL,
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

main();
