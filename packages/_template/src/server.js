// ---- MCP SERVER SKELETON ----
// This is the standard pattern for every MCP server in this monorepo.
//
// Flow:
//   1. Import SDK, env, logger, ALL_TOOLS, rate limit middleware, and handlers
//   2. Build TOOL_HANDLERS map (tool name → handler function)
//   3. Create Server instance with name, version, and capabilities declaration
//   4. Register ListTools handler (returns ALL_TOOLS)
//   5. Register CallTool handler (dispatches to TOOL_HANDLERS with rate limit + error handling)
//   6. main() connects via StdioServerTransport

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

// Import your tool handlers here
// import { handleExampleGetResource } from './tools/exampleGetResource.js';

const TOOL_HANDLERS = {
  // Add your tools to this map
  // example_get_resource: handleExampleGetResource,
};

const rateLimitMiddleware = createRateLimitMiddleware(200);

const server = new Server(
  {
    name: 'my-server-name', // ← Replace with your server's kebab-case name
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
    logger.info('My Server running', {
      port: env.MCP_PORT,
      level: env.MCP_LOG_LEVEL,
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

main();
