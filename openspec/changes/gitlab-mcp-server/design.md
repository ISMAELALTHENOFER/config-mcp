# Design: GitLab MCP Server

## 1. Technical Approach

Mirror the jira-tempo-mcp architecture exactly — layers with single responsibilities, no framework, pure ESM:

```
Client (Axios) → Service (orchestration) → Mapper (transforms) → Tool Handler (MCP result)
```

Each layer is independently unit-testable. The only deviation from jira-tempo is adding `utils/urlParser.js` for parsing GitLab MR URLs into `{ projectPath, mrIid }`.

## 2. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth header | `PRIVATE-TOKEN` | GitLab PAT auth, unlike Jira's Basic Auth |
| Project path encoding | `encodeURIComponent()` | GitLab API v4 requires URL-encoded paths (e.g., `group%2Fproject`) |
| File content endpoint | `/projects/{id}/repository/files/{path}/raw` | Raw endpoint returns text directly; binary returns base64 |
| Rate limit | Bottleneck, 10 req/s, 5 concurrent | More conservative than jira-tempo (5 req/s) to handle self-hosted instances |
| Validation per tool | Zod inline schemas in each tool handler | Matches jira-tempo; each handler validates its own params |
| MCP transport | StdioServerTransport | Stdio for Claude Desktop; same as jira-tempo |
| Mapper layer | Pure functions, no classes | Stateless transforms, maximum testability |

## 3. File Structure

```
gitlab-mcp/
├── package.json
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
├── src/
│   ├── server.js                    # MCP entry: ListTools + CallTool routing
│   ├── config/
│   │   └── env.js                   # Zod env validation (GITLAB_BASE_URL, GITLAB_PERSONAL_ACCESS_TOKEN, MCP_PORT, MCP_LOG_LEVEL)
│   ├── schemas/
│   │   └── toolSchemas.js           # ALL_TOOLS array + per-tool schema definitions
│   ├── middleware/
│   │   ├── rateLimit.js             # Bottleneck limiter (10 req/s, 5 concurrent)
│   │   └── validation.js            # Zod schemas + validate() helper
│   ├── utils/
│   │   ├── logger.js                # Winston (mirrors jira-tempo)
│   │   ├── errors.js                # AppError, GitlabError, ValidationError
│   │   └── urlParser.js             # GitLab MR URL → { projectPath, mrIid }
│   ├── gitlab/
│   │   ├── gitlabClient.js          # Axios instance, PRIVATE-TOKEN, Bottleneck, response interceptors
│   │   ├── gitlabService.js         # Orchestrates API calls, composes data, throws typed errors
│   │   └── gitlabMapper.js          # Pure transforms: mapMr, mapDiff, mapComment, mapApproval, etc.
│   └── tools/
│       ├── getMr.js                 # get_mr — MR details by URL or projectPath + mrIid
│       ├── getMrDiffs.js            # get_mr_diffs — file changes in an MR
│       ├── getMrComments.js         # get_mr_comments — discussion threads
│       ├── getMrApprovals.js        # get_mr_approvals — approval state
│       ├── getMrPipelines.js        # get_mr_pipelines — CI pipeline statuses
│       ├── listProjectMrs.js        # list_project_mrs — paginated, filterable MR list
│       ├── getProject.js            # get_project — project metadata
│       ├── listBranches.js          # list_branches — repository branches
│       └── getFileContent.js        # get_file_content — raw file from repo
└── tests/
    ├── unit/
    │   ├── utils/
    │   │   └── urlParser.test.js
    │   ├── gitlab/
    │   │   ├── gitlabMapper.test.js
    │   │   ├── gitlabService.test.js
    │   │   └── gitlabClient.test.js
    │   ├── tools/
    │   │   ├── getMr.test.js
    │   │   ├── getMrDiffs.test.js
    │   │   ├── getMrComments.test.js
    │   │   ├── getMrApprovals.test.js
    │   │   ├── getMrPipelines.test.js
    │   │   ├── listProjectMrs.test.js
    │   │   ├── getProject.test.js
    │   │   ├── listBranches.test.js
    │   │   └── getFileContent.test.js
    │   └── config/
    │       └── env.test.js
    └── fixtures/
        ├── mr.json
        ├── mrDiffs.json
        ├── mrComments.json
        ├── mrApprovals.json
        ├── mrPipelines.json
        ├── project.json
        ├── branches.json
        └── fileContent.json
```

## 4. Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  MCP Client (Claude Desktop)                            │
│  calls tool "get_mr" with { url }                       │
└────────────┬────────────────────────────────────────────┘
             │ JSON-RPC over stdio
             ▼
┌─────────────────────────────────────────────────────────┐
│  server.js                                              │
│  1. ListToolsRequestSchema → returns ALL_TOOLS          │
│  2. CallToolRequestSchema → lookup TOOL_HANDLERS[name]  │
│  3. Wraps in rateLimitMiddleware.handler()               │
└────────────┬────────────────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────────────────┐
│  tools/getMr.js                                         │
│  1. validate() args with Zod schema                     │
│  2. If url provided → urlParser.parseMrUrl(url)         │
│  3. Calls gitlabService.getMr(projectPath, mrIid)       │
│  4. Returns { content: [{ type: 'text', text: ... }] }  │
└────────────┬────────────────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────────────────┐
│  gitlab/gitlabService.js                                │
│  1. Calls gitlabClient.get(path, params)                │
│  2. Throws GitlabError on failure                       │
└────────────┬────────────────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────────────────┐
│  gitlab/gitlabClient.js                                 │
│  1. Axios instance with PRIVATE-TOKEN auth              │
│  2. Bottleneck rate limiter                             │
│  3. Response interceptor → typed errors per status      │
│  4. Returns raw API data                                │
└────────────┬────────────────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────────────────┐
│  gitlab/gitlabService.js (response)                     │
│  1. Passes raw data to gitlabMapper.mapMr(raw)          │
│  2. Returns clean mapped result                         │
└────────────┬────────────────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────────────────┐
│  tools/getMr.js → server.js → MCP response             │
│  { content: [{ type: 'text', text: JSON.stringify(...) }] } │
└─────────────────────────────────────────────────────────┘
```

Error path (any layer):
```
Tool Handler → catch → { content: [{ text: error JSON }], isError: true }
```

## 5. URL Parsing Strategy

**File**: `utils/urlParser.js`

**Pattern**: `{base_url}/{project_path}/-/merge_requests/{iid}`

**Algorithm**:

```
1. Validate URL format (new URL())
2. Split pathname by '/'
3. Find "/-/merge_requests/" in pathname
4. Everything BEFORE "/-/merge_requests/" = projectPath (keep slashes)
5. Segment AFTER = mrIid (parse as integer)
6. Return { projectPath, mrIid }
```

**Coverage**:

| Input | Result |
|-------|--------|
| `https://gitlab.com/group/project/-/merge_requests/42` | `{ projectPath: "group/project", mrIid: 42 }` |
| `https://gitlab.example.com/group/subgroup/project/-/merge_requests/7` | `{ projectPath: "group/subgroup/project", mrIid: 7 }` |
| `https://gitlab.com/group/project/-/merge_requests/42?foo=bar` | `{ projectPath: "group/project", mrIid: 42 }` |
| `http://localhost:8080/group/project/-/merge_requests/1` | `{ projectPath: "group/project", mrIid: 1 }` |
| `https://invalid` | `ValidationError: "Invalid GitLab MR URL"` |
| `https://gitlab.com/group/project/-/issues/42` | `ValidationError: "URL is not a merge request"` |
| `https://gitlab.com/group/project/-/merge_requests/abc` | `ValidationError: "MR IID must be a number"` |

## 6. Error Handling Strategy

**Typed error classes** (`utils/errors.js`):

| Error | Base | Status | Description |
|-------|------|--------|-------------|
| `AppError` | `Error` | 500 | Base class with statusCode |
| `GitlabError` | `AppError` | varies | API errors, prefix "GitLab:" |
| `ValidationError` | `AppError` | 400 | Input validation failures |

**Client interceptors** (in `gitlabClient.js`):

| Status | Error message |
|--------|---------------|
| 401 | "GitLab authentication failed. Check your personal access token." |
| 403 | "GitLab access denied. Token lacks permissions for this resource." |
| 404 | "GitLab resource not found." |
| 429 | "GitLab rate limit exceeded. Try again later." |
| Other | "GitLab request failed ({status})" |

**Server catch block** (in `server.js`):
- Any unhandled error → `{ content: [{ text: JSON.stringify({ success: false, message }) }], isError: true }`
- Logged with Winston at `error` level including duration

## 7. Testing Strategy

Strict TDD per layer. Jest with `--experimental-vm-modules`.

| Layer | What to test | Fixtures needed |
|-------|--------------|-----------------|
| `urlParser` | All URL formats, edge cases, invalid inputs | Inline strings |
| `gitlabMapper` | Each map* function with raw fixture input → expected output shape | JSON fixtures per entity |
| `gitlabClient` | Interceptor behavior per status code, auth header format | Mock axios |
| `gitlabService` | Orchestration: correct API calls, error wrapping, data composition | Mock client |
| `tools/*` | Validation, service delegation, MCP response format | Mock service |
| `config/env` | Missing vars, invalid URLs, defaults | `process.env` override |
| `server` | ListTools returns ALL_TOOLS, unknown tool error | Static imports |

**Coverage threshold**: 90%+ branches, 100% for `urlParser` and mappers (pure logic).

## 8. Open Questions

1. **Tool count mismatch**: Proposal says "10 tools (3 core + 7 secondary)" but only 9 are listed in the scope. Is a 10th tool needed (e.g., `get_mr_commits`)?
2. **Pagination default**: `list_project_mrs` — confirm maxResults default of 20 with max 100?
3. **Binary file handling**: `get_file_content` — should we detect content type from the API response headers or always return as text with a `is_binary` flag?
4. **Approvals API**: GitLab 15.4+ has a new approvals API (`/approval_state`). Should we use the legacy endpoint or the new one? Self-hosted instances may lag.

---

**File**: `openspec/changes/gitlab-mcp-server/design.md`
