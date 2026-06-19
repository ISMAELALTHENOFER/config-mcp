# Tasks: GitLab MCP Server

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2500–3500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation + GitLab Core → PR 2: Tools + Server → PR 3: Config/Docs |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + GitLab Core + Tests | PR 1 | package.json, env, utils, schemas, middleware, gitlabClient/Service/Mapper, urlParser, fixtures, all corresponding tests. Base: main |
| 2 | Tool Handlers + Server + Tests | PR 2 | All 9 tool handlers + server.js + tool tests. Depends on PR 1 |
| 3 | Config files + README | PR 3 | .env.example, jest.config.js, eslint, prettier, Dockerfile, docker-compose, README. Independent |

## Phase 1: Foundation

- [ ] 1.1 Create `gitlab-mcp/package.json` — ESM, scripts, deps (mirror jira-tempo-mcp)
- [ ] 1.2 Create `src/config/env.js` — Zod validation for 4 env vars
- [ ] 1.3 Create `src/utils/logger.js` — Winston logger
- [ ] 1.4 Create `src/utils/errors.js` — AppError, GitlabError, ValidationError
- [ ] 1.5 Create `src/middleware/rateLimit.js` — Bottleneck (10 req/s, 5 concurrent)
- [ ] 1.6 Create `src/schemas/toolSchemas.js` — ALL_TOOLS array and input schemas
- [ ] 1.7 Create `src/middleware/validation.js` — Zod validate() helper

## Phase 2: GitLab Core

- [ ] 2.1 Create `src/utils/urlParser.js` — parseMrUrl() covering all 7 URL patterns from design
- [ ] 2.2 Create `src/gitlab/gitlabClient.js` — Axios, PRIVATE-TOKEN, interceptors per status
- [ ] 2.3 Create `src/gitlab/gitlabMapper.js` — Pure mapMr, mapDiff, mapComment, mapApproval, mapPipeline, mapProject, mapBranch
- [ ] 2.4 Create `src/gitlab/gitlabService.js` — Orchestrate API calls, typed errors

## Phase 3: Tools (Core)

- [ ] 3.1 Create `src/tools/getMr.js` — get_mr with urlParser delegation
- [ ] 3.2 Create `src/tools/getMrDiffs.js` — get_mr_diffs
- [ ] 3.3 Create `src/tools/getFileContent.js` — get_file_content with path traversal guard

## Phase 4: Tools (Secondary)

- [ ] 4.1 Create `src/tools/getMrComments.js`
- [ ] 4.2 Create `src/tools/getMrApprovals.js`
- [ ] 4.3 Create `src/tools/getMrPipelines.js`
- [ ] 4.4 Create `src/tools/listProjectMrs.js` — paginated, filterable list
- [ ] 4.5 Create `src/tools/getProject.js`
- [ ] 4.6 Create `src/tools/listBranches.js` — with search filter

## Phase 5: Server & Wiring

- [ ] 5.1 Create `src/server.js` — MCP Server, ListTools, CallTool routing, error wrapping

## Phase 6: Tests (TDD)

- [ ] 6.1 Write tests for `utils/urlParser` — all URL formats, edge cases, invalid inputs
- [ ] 6.2 Write tests for `config/env` — missing vars, invalid URLs, defaults
- [ ] 6.3 Write tests for `gitlab/gitlabClient` — auth header, interceptors, network error
- [ ] 6.4 Write tests for `gitlab/gitlabMapper` — each map* function with fixture data
- [ ] 6.5 Write tests for `gitlab/gitlabService` — orchestration, error wrapping, composition
- [ ] 6.6 Write tests for each tool handler (9 tools) — validation, delegation, MCP response
- [ ] 6.7 Create test fixtures under `tests/fixtures/` — mr, diffs, comments, approvals, pipelines, project, branches, fileContent

## Phase 7: Config Files

- [ ] 7.1 Create `.env.example` with documented env vars
- [ ] 7.2 Create `jest.config.js` — ESM, coverage threshold 90%
- [ ] 7.3 Create `.eslintrc.json` and `.prettierrc`
- [ ] 7.4 Create `Dockerfile` and `docker-compose.yml`
- [ ] 7.5 Create `README.md` — env vars, tool reference, setup
