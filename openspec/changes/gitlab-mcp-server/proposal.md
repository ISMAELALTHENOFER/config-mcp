# Proposal: GitLab MCP Server

## Intent

Build a read-only MCP server exposing GitLab data (MRs, diffs, files, branches, projects, pipelines, comments, approvals) for AI assistants. Mirrors the established jira-tempo-mcp architecture so the monorepo remains consistent.

## Scope

### In Scope
- Full `gitlab-mcp/` server package with config files (package.json, Dockerfile, .env.example, eslint, prettier, README)
- 10 tools: 3 core (`get_mr`, `get_mr_diffs`, `get_file_content`) + 7 secondary (`get_mr_comments`, `get_mr_approvals`, `get_mr_pipelines`, `list_project_mrs`, `get_project`, `list_branches`)
- `utils/urlParser.js` to parse GitLab MR URLs into project + IID
- Client layer for GitLab REST API v4 with `PRIVATE-TOKEN` auth
- Strict TDD — Jest tests for every module, red-green-refactor cycle
- Rate limiting (Bottleneck), validation (Zod), logging (Winston)

### Out of Scope
- Write operations (comment, approve, merge, create MR/branch)
- Web UI (deferred — same pattern as jira-tempo-mcp `web/`)
- GitLab GraphQL API (REST-only for now)
- CI/CD config or pipeline templates

## Capabilities

### New Capabilities
- `gitlab-mr-read`: Read MR details, diffs, comments, approvals, pipelines, and list MRs by project
- `gitlab-file-read`: Read file content from repository branches

### Modified Capabilities
None

## Approach

Mirror jira-tempo-mcp exactly: **client → mapper → service → tool handlers**. Each layer has a single responsibility:

- **client/** — Axios instance with `PRIVATE-TOKEN` header, base URL from `GITLAB_BASE_URL`, Bottleneck rate limiter
- **mapper/** — Transform GitLab API responses into clean tool output
- **service/** — Orchestrate API calls, compose data as needed
- **tools/** — One file per tool, Zod schema for input validation, handler returns MCP tool result
- **utils/** — Shared utilities: `urlParser.js`, `errors.js`, `logger.js`

Deviation from jira-tempo: add `utils/urlParser.js` to extract project path and MR IID from full GitLab MR URLs (e.g., `https://gitlab.example.com/group/project/-/merge_requests/42`).

Auth via `GITLAB_PERSONAL_ACCESS_TOKEN` env var, base URL via `GITLAB_BASE_URL`. Supports both self-hosted and gitlab.com.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `gitlab-mcp/` | New | Full server directory (src/, tests/, config files) |
| `openspec/specs/gitlab-mr-read/` | New | MR read capability spec |
| `openspec/specs/gitlab-file-read/` | New | File read capability spec |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Self-hosted API differs from gitlab.com | Medium | Test against actual instance, flexible URL parsing |
| Rate limiting on self-hosted instance | Low | Bottleneck rate limiter with configurable interval |
| MR URL edge cases | Low | Unit tests covering all URL patterns |

## Rollback Plan

1. Remove `gitlab-mcp/` directory entirely
2. Revert any Claude Desktop MCP config changes
3. Archive `openspec/changes/gitlab-mcp-server/` if committed

## Dependencies

- Access to `https://gitlab.tsgroup.com.ar` with valid PAT
- Node 22+, npm packages (same stack as jira-tempo-mcp)

## Success Criteria

- [ ] All 10 tools return correct GitLab data against actual instance
- [ ] URL parser handles all GitLab MR URL formats correctly
- [ ] 100% test suite passes (Jest, no skipped tests)
- [ ] README documents env vars and all tool schemas
