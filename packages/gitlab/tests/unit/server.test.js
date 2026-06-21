import { describe, it, expect, jest } from '@jest/globals';

// Track handler registrations
let registeredListHandler = null;
let registeredCallToolHandler = null;

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation((_info, _caps) => ({
    setRequestHandler: jest.fn((schema, handler) => {
      // Identify handler by schema description (we check in tests)
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
    { name: 'get_mr', description: 'Get MR details' },
    { name: 'get_mr_diffs', description: 'Get MR diffs' },
    { name: 'get_mr_comments', description: 'Get MR comments' },
    { name: 'get_mr_approvals', description: 'Get MR approvals' },
    { name: 'get_mr_pipelines', description: 'Get MR pipelines' },
    { name: 'list_project_mrs', description: 'List project MRs' },
    { name: 'get_project', description: 'Get project' },
    { name: 'list_branches', description: 'List branches' },
    { name: 'get_file_content', description: 'Get file content' },
  ];

  return {
    ALL_TOOLS: TOOLS,
  };
});

jest.unstable_mockModule('../../src/tools/getMr.js', () => ({
  handleGetMr: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'mock-mr' }] }),
}));
jest.unstable_mockModule('../../src/tools/getMrDiffs.js', () => ({
  handleGetMrDiffs: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'mock-diffs' }] }),
}));
jest.unstable_mockModule('../../src/tools/getMrComments.js', () => ({
  handleGetMrComments: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'mock-comments' }] }),
}));
jest.unstable_mockModule('../../src/tools/getMrApprovals.js', () => ({
  handleGetMrApprovals: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'mock-approvals' }] }),
}));
jest.unstable_mockModule('../../src/tools/getMrPipelines.js', () => ({
  handleGetMrPipelines: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'mock-pipelines' }] }),
}));
jest.unstable_mockModule('../../src/tools/listProjectMrs.js', () => ({
  handleListProjectMrs: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'mock-mrs' }] }),
}));
jest.unstable_mockModule('../../src/tools/getProject.js', () => ({
  handleGetProject: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'mock-project' }] }),
}));
jest.unstable_mockModule('../../src/tools/listBranches.js', () => ({
  handleListBranches: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'mock-branches' }] }),
}));
jest.unstable_mockModule('../../src/tools/getFileContent.js', () => ({
  handleGetFileContent: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'mock-file' }] }),
}));

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
      { name: 'gitlab', version: '1.0.0' },
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
        'get_mr',
        'get_mr_approvals',
        'get_mr_comments',
        'get_mr_diffs',
        'get_mr_pipelines',
        'get_project',
        'list_branches',
        'list_project_mrs',
      ]);
    });
  });

  describe('CallTool handler', () => {
    it('should route get_mr to handleGetMr', async () => {
      const result = await registeredCallToolHandler({ params: { name: 'get_mr', arguments: { url: 'https://gitlab.com/g/p/-/merge_requests/1' } } });

      const { handleGetMr } = await import('../../src/tools/getMr.js');
      expect(handleGetMr).toHaveBeenCalledWith({ url: 'https://gitlab.com/g/p/-/merge_requests/1' });
      expect(result).toEqual({ content: [{ type: 'text', text: 'mock-mr' }] });
    });

    it('should route get_mr_diffs to handleGetMrDiffs', async () => {
      const result = await registeredCallToolHandler({ params: { name: 'get_mr_diffs', arguments: { projectId: 'g/p', mrIid: 1 } } });

      const { handleGetMrDiffs } = await import('../../src/tools/getMrDiffs.js');
      expect(handleGetMrDiffs).toHaveBeenCalledWith({ projectId: 'g/p', mrIid: 1 });
      expect(result).toEqual({ content: [{ type: 'text', text: 'mock-diffs' }] });
    });

    it('should route get_mr_comments to handleGetMrComments', async () => {
      await registeredCallToolHandler({ params: { name: 'get_mr_comments', arguments: { projectId: 'g/p', mrIid: 1 } } });

      const { handleGetMrComments } = await import('../../src/tools/getMrComments.js');
      expect(handleGetMrComments).toHaveBeenCalled();
    });

    it('should route get_mr_approvals to handleGetMrApprovals', async () => {
      await registeredCallToolHandler({ params: { name: 'get_mr_approvals', arguments: { projectId: 'g/p', mrIid: 1 } } });

      const { handleGetMrApprovals } = await import('../../src/tools/getMrApprovals.js');
      expect(handleGetMrApprovals).toHaveBeenCalled();
    });

    it('should route get_mr_pipelines to handleGetMrPipelines', async () => {
      await registeredCallToolHandler({ params: { name: 'get_mr_pipelines', arguments: { projectId: 'g/p', mrIid: 1 } } });

      const { handleGetMrPipelines } = await import('../../src/tools/getMrPipelines.js');
      expect(handleGetMrPipelines).toHaveBeenCalled();
    });

    it('should route list_project_mrs to handleListProjectMrs', async () => {
      await registeredCallToolHandler({ params: { name: 'list_project_mrs', arguments: { projectId: 'g/p' } } });

      const { handleListProjectMrs } = await import('../../src/tools/listProjectMrs.js');
      expect(handleListProjectMrs).toHaveBeenCalled();
    });

    it('should route get_project to handleGetProject', async () => {
      await registeredCallToolHandler({ params: { name: 'get_project', arguments: { projectPath: 'g/p' } } });

      const { handleGetProject } = await import('../../src/tools/getProject.js');
      expect(handleGetProject).toHaveBeenCalled();
    });

    it('should route list_branches to handleListBranches', async () => {
      await registeredCallToolHandler({ params: { name: 'list_branches', arguments: { projectId: 'g/p' } } });

      const { handleListBranches } = await import('../../src/tools/listBranches.js');
      expect(handleListBranches).toHaveBeenCalled();
    });

    it('should route get_file_content to handleGetFileContent', async () => {
      await registeredCallToolHandler({ params: { name: 'get_file_content', arguments: { projectId: 'g/p', filePath: 'f.js' } } });

      const { handleGetFileContent } = await import('../../src/tools/getFileContent.js');
      expect(handleGetFileContent).toHaveBeenCalled();
    });

    it('should return error for unknown tool', async () => {
      const result = await registeredCallToolHandler({
        params: { name: 'unknown_tool', arguments: {} },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });

    it('should return error when handler throws', async () => {
      const { handleGetMr } = await import('../../src/tools/getMr.js');
      handleGetMr.mockRejectedValueOnce(new Error('Something broke'));

      const result = await registeredCallToolHandler({ params: { name: 'get_mr', arguments: { url: 'https://gitlab.com/g/p/-/merge_requests/1' } } });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Something broke');
    });
  });
});
