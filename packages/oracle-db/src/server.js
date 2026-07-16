import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { ALL_TOOLS } from './schemas/toolSchemas.js';

import { handlePing } from './tools/ping.js';
import { handleQuery } from './tools/query.js';
import { handleListTables } from './tools/listTables.js';
import { handleDescribeTable } from './tools/describeTable.js';

const TOOL_HANDLERS = {
  ping: handlePing,
  query: handleQuery,
  list_tables: handleListTables,
  describe_table: handleDescribeTable,
};

const server = new Server(
  {
    name: 'oracle-db',
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

    const result = await handler(args);

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
    logger.info('Oracle DB Server running', {
      connectString: env.ORACLE_CONNECT_STRING,
      level: env.MCP_LOG_LEVEL,
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

main();
