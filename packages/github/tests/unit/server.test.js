import { describe, it, expect, jest } from '@jest/globals';

// Track handler registrations
let registeredListHandler = null;
let registeredCallToolHandler = null;

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation((_info, _caps) => ({
    setRequestHandler: jest.fn((schema, handler) => {
      if (schema === 'ListToolsRequestSchema') {
        registeredListHandler = handler;
      } else if (schema === 'CallToolRequestSchema') {
        registeredCallToolHandler = handler;
      }
    }),
    connect: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({})),
}));

jest.unstable_mockModule('@modelcontextprotocol/sdk/types.js', () => ({
  ListToolsRequestSchema: 'ListToolsRequestSchema',
  CallToolRequestSchema: 'CallToolRequestSchema',
}));

jest.unstable_mockModule('../../src/config/env.js', () => ({
  env: { MCP_LOG_LEVEL: 'info', MCP_PORT: 3000 },
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.unstable_mockModule('@config-mcp/mcp-core', () => ({
  createRateLimitMiddleware: jest.fn(() => ({
    name: 'rateLimit',
    handler: jest.fn((_req, next) => next()),
  })),
}));

jest.unstable_mockModule('../../src/schemas/toolSchemas.js', () => {
  const TOOLS = [
    { name: 'get_repository', description: 'Get repository' },
    { name: 'list_pull_requests', description: 'List pull requests' },
    { name: 'get_pull_request', description: 'Get pull request' },
    { name: 'get_pull_request_files', description: 'Get pull request files' },
    { name: 'get_pull_request_comments', description: 'Get pull request comments' },
    { name: 'get_pull_request_reviews', description: 'Get pull request reviews' },
    { name: 'get_pull_request_checks', description: 'Get pull request checks' },
    { name: 'list_branches', description: 'List branches' },
    { name: 'get_file_content', description: 'Get file content' },
  ];

  return {
    ALL_TOOLS: TOOLS,
  };
});

const TOOL_MODULES = {
  handleGetRepository: ['getRepository', 'mock-repository'],
  handleListPullRequests: ['listPullRequests', 'mock-pulls'],
  handleGetPullRequest: ['getPullRequest', 'mock-pull'],
  handleGetPullRequestFiles: ['getPullRequestFiles', 'mock-files'],
  handleGetPullRequestComments: ['getPullRequestComments', 'mock-comments'],
  handleGetPullRequestReviews: ['getPullRequestReviews', 'mock-reviews'],
  handleGetPullRequestChecks: ['getPullRequestChecks', 'mock-checks'],
  handleListBranches: ['listBranches', 'mock-branches'],
  handleGetFileContent: ['getFileContent', 'mock-file'],
};

for (const [handler, [file, text]] of Object.entries(TOOL_MODULES)) {
  jest.unstable_mockModule(`../../src/tools/${file}.js`, () => ({
    [handler]: jest.fn().mockResolvedValue({ content: [{ type: 'text', text }] }),
  }));
}

// Snapshot construction facts before any test can clear them
await import('../../src/server.js');

const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
const { ALL_TOOLS } = await import('../../src/schemas/toolSchemas.js');

// Capture constructor args and connect call before jest.clearAllMocks
const serverConstructorCall = Server.mock.calls[0];
const serverInstance = Server.mock.results[0].value;
const serverConnectedCalled = serverInstance.connect.mock.calls.length > 0;

describe('Server construction', () => {
  it('should create Server with correct name and version', () => {
    expect(serverConstructorCall).toEqual([
      { name: 'github', version: '1.0.0' },
      { capabilities: { tools: {} } },
    ]);
  });

  it('should call server.connect', () => {
    expect(serverConnectedCalled).toBe(true);
  });
});

describe('server.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ListTools handler', () => {
    it('should return ALL_TOOLS', async () => {
      const result = await registeredListHandler();
      expect(result).toEqual({ tools: ALL_TOOLS });
    });

    it('should contain all 9 expected tools', async () => {
      const result = await registeredListHandler();
      const toolNames = result.tools.map((t) => t.name).sort();
      expect(toolNames).toEqual([
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
  });

  describe('CallTool handler', () => {
    const ROUTES = [
      ['get_repository', 'getRepository', 'handleGetRepository', 'mock-repository'],
      ['list_pull_requests', 'listPullRequests', 'handleListPullRequests', 'mock-pulls'],
      ['get_pull_request', 'getPullRequest', 'handleGetPullRequest', 'mock-pull'],
      [
        'get_pull_request_files',
        'getPullRequestFiles',
        'handleGetPullRequestFiles',
        'mock-files',
      ],
      [
        'get_pull_request_comments',
        'getPullRequestComments',
        'handleGetPullRequestComments',
        'mock-comments',
      ],
      [
        'get_pull_request_reviews',
        'getPullRequestReviews',
        'handleGetPullRequestReviews',
        'mock-reviews',
      ],
      [
        'get_pull_request_checks',
        'getPullRequestChecks',
        'handleGetPullRequestChecks',
        'mock-checks',
      ],
      ['list_branches', 'listBranches', 'handleListBranches', 'mock-branches'],
      ['get_file_content', 'getFileContent', 'handleGetFileContent', 'mock-file'],
    ];

    it.each(ROUTES)(
      'should route %s to %s handler',
      async (tool, file, handlerName, text) => {
        const args = { repository: 'o/r' };
        const result = await registeredCallToolHandler({
          params: { name: tool, arguments: args },
        });

        const mod = await import(`../../src/tools/${file}.js`);
        expect(mod[handlerName]).toHaveBeenCalledWith(args);
        expect(result).toEqual({ content: [{ type: 'text', text }] });
      },
    );

    it('should return error for unknown tool', async () => {
      const result = await registeredCallToolHandler({
        params: { name: 'unknown_tool', arguments: {} },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });

    it('should return error when handler throws', async () => {
      const { handleGetPullRequest } = await import('../../src/tools/getPullRequest.js');
      handleGetPullRequest.mockRejectedValueOnce(new Error('Something broke'));

      const result = await registeredCallToolHandler({
        params: {
          name: 'get_pull_request',
          arguments: { repository: 'o/r', pullNumber: 1 },
        },
      });

      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text)).toEqual({
        success: false,
        message: 'Something broke',
      });
    });
  });
});
