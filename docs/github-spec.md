# MCP GitHub Server

## Objective

Provide a Model Context Protocol server written in JavaScript that lets AI models query GitHub through specialized **read-only** tools: repositories, pull requests, reviews, checks, branches and file contents. It mirrors the structure, error model and conventions of the GitLab server (`docs/gitlab-spec.md`).

The server must:

* Get a pull request by URL, or by repository and number.
* Get the changed files (with patches), conversation and review comments, reviews and check runs of a pull request.
* List pull requests with filters by state, base/head branch and labels.
* Get repository details.
* List branches with optional name search.
* Get file contents at a branch, tag or commit.
* Keep credentials and sensitive data safe.
* Work with github.com and GitHub Enterprise Server.

---

# Functional goals

```text
Show me PR 42 of octo/project.
```

```text
Which files changed in PR 42?
```

```text
How are the checks of PR 42?
```

```text
Is PR 42 approved?
```

```text
List the open PRs of octo/project with label "bug".
```

```text
Find branches containing "hotfix" in octo/project.
```

```text
Read docker-compose.yml from octo/project.
```

---

# Technology stack

* Node.js 22+
* JavaScript ES Modules
* MCP SDK
* Axios
* Zod
* dotenv
* Winston
* Bottleneck (via @config-mcp/mcp-core)
* Jest

---

# Architecture

```text
LLM
 │
 ▼
MCP Client
 │
 ▼
GitHub MCP Server
 │
 └── GitHub REST API
```

---

# Project structure

```text
config-mcp/
├── .env                          # Centralized variables (monorepo root)
├── .env.example                  # Variable template
│
└── packages/github/
    ├── src/
    │   ├── server.js             # Entry point: registers MCP tools and handlers
    │   ├── config/
    │   │   └── env.js            # Loads the root .env and validates with Zod
    │   ├── github/
    │   │   ├── githubClient.js   # HTTP client: Bearer auth, Link-header pagination
    │   │   ├── githubMapper.js   # Turns API responses into flat objects
    │   │   └── githubService.js  # Business logic: orchestrates calls + mappers
    │   ├── middleware/
    │   │   └── validation.js     # Zod validation helpers
    │   ├── schemas/
    │   │   └── toolSchemas.js    # Tool schemas and central registry
    │   ├── tools/                # One handler per tool (9)
    │   └── utils/
    │       ├── logger.js         # Winston logger
    │       ├── errors.js         # GithubError
    │       └── urlParser.js      # Repository and pull request URL parsing
    ├── tests/
    ├── package.json
    └── README.md
```

---

# Security

## Mandatory rule

Never expose:

* Tokens
* Passwords
* Environment variables
* API keys
* Authorization headers
* Cookies
* Internal infrastructure information

If the user asks for sensitive data:

```text
Sorry, sensitive system information is not available.
```

The token is sent only to the configured `GITHUB_API_URL` host. Pagination follows `page` numbers from the `Link` header and never requests absolute URLs taken from responses.

---

# Environment variables (centralized)

All variables live in the `.env` file at the monorepo root. Each server loads it automatically from `../../../../.env`.

```env
# GitHub
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxx
# Optional. Default: https://api.github.com. GitHub Enterprise Server: https://<host>/api/v3
GITHUB_API_URL=https://api.github.com

# MCP (shared)
MCP_PORT=3000
MCP_LOG_LEVEL=info
```

---

# GitHub integration

## Authentication

```http
Authorization: Bearer github_pat_xxxxxxxxxxxxxxxx
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
```

Base URL:

```text
https://api.github.com
```

Endpoints:

```http
GET /repos/{owner}/{repo}

GET /repos/{owner}/{repo}/pulls

GET /repos/{owner}/{repo}/pulls/{number}

GET /repos/{owner}/{repo}/pulls/{number}/files

GET /repos/{owner}/{repo}/issues/{number}/comments

GET /repos/{owner}/{repo}/pulls/{number}/comments

GET /repos/{owner}/{repo}/pulls/{number}/reviews

GET /repos/{owner}/{repo}/commits/{sha}/check-runs

GET /repos/{owner}/{repo}/branches

GET /repos/{owner}/{repo}/contents/{path}     # Accept: application/vnd.github.raw+json
```

Pagination uses the `Link` response header (`rel="next"`), 100 items per page.

## Error mapping

| Status | Result |
|---|---|
| 401 | `GitHub: GitHub authentication failed. Check your token.` |
| 403 with `x-ratelimit-remaining: 0` | rate limit error (status 429) |
| 403 | access denied |
| 404 | resource not found |
| 429 | rate limit exceeded |
| other | `GitHub request failed (<status>)` |

---

# MCP tools

GitLab to GitHub mapping:

| GitLab | GitHub |
|---|---|
| `get_project` | `get_repository` |
| `list_project_mrs` | `list_pull_requests` |
| `get_mr` | `get_pull_request` |
| `get_mr_diffs` | `get_pull_request_files` |
| `get_mr_comments` | `get_pull_request_comments` |
| `get_mr_approvals` | `get_pull_request_reviews` |
| `get_mr_pipelines` | `get_pull_request_checks` |
| `list_branches` | `list_branches` |
| `get_file_content` | `get_file_content` |

Every tool takes `repository` as `owner/repo` or a GitHub repository URL.

## get_repository

Input:

```json
{
  "repository": "octo/project"
}
```

---

## list_pull_requests

Input:

```json
{
  "repository": "octo/project",
  "state": "open",
  "base": "main",
  "head": "octo:feature/auth",
  "labels": "bug,ui"
}
```

`state` is `open`, `closed`, `merged` or `all`. `merged` and `labels` are applied after fetching because the GitHub endpoint does not support them.

---

## get_pull_request

Input (either `url`, or `repository` + `pullNumber`):

```json
{
  "url": "https://github.com/octo/project/pull/42",
  "repository": "octo/project",
  "pullNumber": 42
}
```

Includes `headSha` and `baseSha`.

---

## get_pull_request_files

Input:

```json
{
  "repository": "octo/project",
  "pullNumber": 42
}
```

Output is `{ files, truncated }`. A file whose patch GitHub did not return (binary, too large, or no textual change) has `patch: null` and `patchOmitted: true`. `truncated` is `true` when the 3000-file cap of the endpoint was reached.

---

## get_pull_request_comments

Input:

```json
{
  "repository": "octo/project",
  "pullNumber": 42
}
```

Merges conversation comments (`kind: "issue"`) and inline review threads (`kind: "review"`, with replies). `resolved` is `null` because the REST API does not expose thread resolution.

---

## get_pull_request_reviews

Input:

```json
{
  "repository": "octo/project",
  "pullNumber": 42
}
```

Returns `approved`, `approvers`, `changesRequestedBy` and the individual `reviews`. Each reviewer counts once by their latest `APPROVED` or `CHANGES_REQUESTED` review.

---

## get_pull_request_checks

Input:

```json
{
  "repository": "octo/project",
  "pullNumber": 42
}
```

Returns the check runs of the head commit. Legacy commit statuses are not included.

---

## list_branches

Input:

```json
{
  "repository": "octo/project",
  "search": "hotfix"
}
```

The name filter is applied after fetching all branches.

---

## get_file_content

Input:

```json
{
  "repository": "octo/project",
  "filePath": "src/index.js",
  "ref": "main"
}
```

---

# Validation

Use Zod to validate:

* repository (`owner/repo` or URL, strictly parsed)
* pullNumber (positive integer)
* GitHub pull request URL
* filePath (with path traversal protection)
* state (open, closed, merged, all)
* Labels
* Ref (branch, tag or commit SHA)

---

# Rate limiting

Bottleneck via @config-mcp/mcp-core: a tool-level middleware (`minTime: 100`) and the shared HTTP limiter used by the client.

---

# Logging

Record:

* Tool executed
* Response time
* Result
* Error (without exposing tokens)

Format:

```json
{
  "tool": "get_pull_request",
  "duration": 123,
  "success": true
}
```

---

# Error handling

Return clear messages:

```json
{
  "success": false,
  "message": "GitHub: GitHub resource not found."
}
```

---

# Deliverables

1. Complete source code.
2. MCP configuration.
3. Dockerfile.
4. docker-compose.yml.
5. README.
6. Unit tests.
7. ESLint and Prettier.
8. Usage examples.
9. Secure configuration through `.env`.
10. GitHub REST API integration, including GitHub Enterprise Server.
