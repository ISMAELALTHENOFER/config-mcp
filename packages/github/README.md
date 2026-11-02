# GitHub MCP Server

MCP server that exposes **read-only** tools for GitHub. It is designed to work with AI assistants (OpenCode, Claude Desktop, Cursor, Windsurf) so you can inspect repositories, pull requests, reviews, checks, branches and file contents without leaving the editor. It works with github.com and GitHub Enterprise Server.

## Quick Start

```bash
npm install
cp ../../.env.example .env
# Edit .env with your GitHub credentials
npm start
```

## Prerequisites

- Node.js 22+ (native ESM)
- A GitHub token with read access: a fine-grained personal access token with `Contents`, `Pull requests` and `Checks` read permissions, or a classic token with the `repo` scope (`public_repo` for public repositories only)

## Tools

All tools are **read-only**: they query data without changing anything in GitHub. Every tool takes the repository as `owner/repo` or as a GitHub repository URL.

### Pull Requests

| Tool | Description |
|---|---|
| `get_pull_request` | Get pull request details by URL, or by repository and pull request number |
| `get_pull_request_files` | Get the changed files and patches of a pull request |
| `get_pull_request_comments` | Get conversation comments and inline review threads of a pull request |
| `get_pull_request_reviews` | Get reviews and approval state of a pull request |
| `get_pull_request_checks` | Get CI check runs for the head commit of a pull request |
| `list_pull_requests` | List pull requests of a repository with optional filters |

### Repository

| Tool | Description |
|---|---|
| `get_repository` | Get repository details |
| `list_branches` | List branches with optional name search |
| `get_file_content` | Get the content of a file in the repository |

### Detailed reference

#### `get_pull_request`

Returns details of a pull request. It can be identified by full URL, or by repository + pull request number.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | No | Full PR URL (e.g. `https://github.com/owner/repo/pull/42`) |
| `repository` | `string` | No | Repository as `owner/repo` or repository URL |
| `pullNumber` | `number` | No | Pull request number |

The response includes `headSha` and `baseSha` (`null` when GitHub does not supply them), `headBranch`, `baseBranch`, `mergeable` and `mergeableState` (both `null` while GitHub is still computing them), and `state` (`open`, `closed` or `merged`). Pin file reads to an explicit commit SHA for reproducible comparisons.

**Example:**
```
Show me PR 42 of octo/project
Get details of https://github.com/octo/project/pull/42
```

#### `get_pull_request_files`

Returns the files changed by a pull request, with their patches.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `repository` | `string` | Yes | Repository as `owner/repo` or repository URL |
| `pullNumber` | `number` | Yes | Pull request number |

The response is `{ files, truncated }`. Results include all pages returned by GitHub. Each file preserves `patchOmitted`: `true` means no patch text was returned for that file (binary file, a diff too large for GitHub to render, or a file without textual changes such as a pure rename), and `patch` is `null`. An empty or missing `patch` alone does not establish that two files are equivalent. GitHub lists at most 3000 files per pull request; `truncated` is `true` when that cap was reached and more files may exist.

**Example:**
```
Which files changed in PR 42?
Show the patch for src/auth/login.js in PR 42 of octo/project
```

#### `get_pull_request_comments`

Returns the conversation comments and the inline review threads of a pull request.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `repository` | `string` | Yes | Repository as `owner/repo` or repository URL |
| `pullNumber` | `number` | Yes | Pull request number |

Each entry has `kind: "issue"` (conversation comment) or `kind: "review"` (inline thread with `path`, `line` and `replies`), ordered by creation time. `resolved` is always `null`: the GitHub REST API does not expose thread resolution.

**Example:**
```
What did the reviewers say on PR 42?
```

#### `get_pull_request_reviews`

Returns the reviews of a pull request and a summary of its approval state.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `repository` | `string` | Yes | Repository as `owner/repo` or repository URL |
| `pullNumber` | `number` | Yes | Pull request number |

Each reviewer counts once, by their latest `APPROVED` or `CHANGES_REQUESTED` review; a `DISMISSED` review clears it, and `COMMENTED` or pending reviews do not change it. `approved` is `true` when there is at least one approver and nobody has requested changes. Required-approval counts and branch protection rules are not available through this tool.

**Example:**
```
Is PR 42 approved?
Who requested changes on PR 42?
```

#### `get_pull_request_checks`

Returns the check runs of the head commit of a pull request (GitHub Actions and other Checks API apps). Legacy commit statuses are not included.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `repository` | `string` | Yes | Repository as `owner/repo` or repository URL |
| `pullNumber` | `number` | Yes | Pull request number |

**Example:**
```
How are the checks of PR 42?
```

#### `list_pull_requests`

Lists pull requests of a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `repository` | `string` | Yes | Repository as `owner/repo` or repository URL |
| `state` | `string` | No | `open`, `closed`, `merged` or `all` |
| `base` | `string` | No | Base (target) branch name |
| `head` | `string` | No | Head branch as `user:branch` or `org:branch` |
| `labels` | `string` | No | Comma-separated label names; all must be present |

GitHub has no `merged` state or label filter on this endpoint: `merged` fetches closed pull requests and keeps those with a merge date, and `labels` is applied after fetching.

**Example:**
```
List open PRs of octo/project
List merged PRs with label "bug" targeting main
```

#### `get_repository`

Returns repository details.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `repository` | `string` | Yes | Repository as `owner/repo` or repository URL |

**Example:**
```
Tell me about octo/project
```

#### `list_branches`

Lists the branches of a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `repository` | `string` | Yes | Repository as `owner/repo` or repository URL |
| `search` | `string` | No | Case-insensitive text the branch name must contain |

GitHub has no server-side branch search, so all branches are fetched and filtered by name. The branch list carries only the head commit SHA and the `protected` flag; use `get_repository` for the default branch.

**Example:**
```
List the branches of octo/project
Find branches containing "hotfix" in octo/project
```

#### `get_file_content`

Returns the content of a file at a given branch, tag or commit.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `repository` | `string` | Yes | Repository as `owner/repo` or repository URL |
| `filePath` | `string` | Yes | Path to the file inside the repository |
| `ref` | `string` | No | Branch, tag or commit SHA (default: the default branch) |

The response uses `encoding: "utf-8"` for valid UTF-8 without NUL bytes and `encoding: "base64"` otherwise. `size` is the byte count received, not the number of characters. A branch or tag `ref` can move; use a commit SHA to pin a read. This file response does not establish equivalence with a pull request patch or another file.

**Example:**
```
Show src/index.js from octo/project
Read docker-compose.yml on branch develop
```

## Environment variables

| Variable | Description | Required |
|---|---|---|
| `GITHUB_TOKEN` | GitHub token with read access (see Prerequisites) | Yes |
| `GITHUB_API_URL` | API base URL (default: `https://api.github.com`). For GitHub Enterprise Server use `https://<host>/api/v3` | No |
| `MCP_PORT` | Server port used in the startup message (default: 3000) | No |
| `MCP_LOG_LEVEL` | Log level: `error`, `warn`, `info`, `debug` (default: `info`) | No |

## Client configuration

### OpenCode

```json
{
  "mcp": {
    "github": {
      "command": ["node", "full/path/config-mcp/packages/github/src/server.js"],
      "enabled": true,
      "type": "local"
    }
  }
}
```

> Environment variables are loaded from the monorepo root `.env`. You do not need to include them in the OpenCode configuration.

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["full/path/config-mcp/packages/github/src/server.js"]
    }
  }
}
```

> Environment variables are loaded from the monorepo root `.env`. You do not need to include them in the Claude configuration.

### Cursor

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["full/path/config-mcp/packages/github/src/server.js"]
    }
  }
}
```

### Windsurf

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["full/path/config-mcp/packages/github/src/server.js"]
    }
  }
}
```

## Architecture

```
src/
├── server.js                    # Entry point: registers tools and handlers
├── config/
│   └── env.js                   # Loads and validates environment variables with Zod
├── github/
│   ├── githubClient.js          # HTTP client with Bearer auth and Link-header pagination
│   ├── githubMapper.js          # Turns API responses into flat objects
│   └── githubService.js         # Business logic: orchestrates calls and mappers
├── middleware/
│   └── validation.js            # Zod schemas for input validation
├── schemas/
│   └── toolSchemas.js           # Tool schemas and central registry
├── tools/
│   ├── getRepository.js
│   ├── listPullRequests.js
│   ├── getPullRequest.js
│   ├── getPullRequestFiles.js
│   ├── getPullRequestComments.js
│   ├── getPullRequestReviews.js
│   ├── getPullRequestChecks.js
│   ├── listBranches.js
│   └── getFileContent.js
└── utils/
    ├── logger.js                # Winston logger
    ├── errors.js                # Custom error classes
    └── urlParser.js             # Parsing of GitHub repository and pull request URLs
```

Rate limiting comes from `@config-mcp/mcp-core` (Bottleneck): one limiter wraps every tool call and another wraps every HTTP request.

**Call flow:**

1. The AI client sends a `CallToolRequest` with the tool name and arguments
2. `server.js` resolves the handler in `TOOL_HANDLERS`
3. The rate limit middleware controls the quota before the handler runs
4. The handler validates its arguments with Zod
5. The handler calls the matching `githubService` function
6. The service issues `GET` requests through `githubClient`
7. The raw response goes through the mapper and is returned as JSON text

## Usage examples

```
Show me PR 42 of octo/project
Which files changed in PR 42?
How are the checks of PR 42?
Is PR 42 approved?
List open PRs of octo/project with label "bug"
Tell me about octo/project
Find branches containing "hotfix" in octo/project
Read docker-compose.yml from octo/project
```

## Development

```bash
npm run dev           # Auto-reload with --watch
npm test              # Jest tests
npm run test:coverage # Coverage (threshold: 90%)
npm run lint          # ESLint
npm run format        # Prettier
```

## Docker

```bash
docker compose up -d
```

## Security

- Authentication with a token sent as `Authorization: Bearer` (never logged)
- Credentials only through `.env` (excluded from git)
- The token is only ever sent to the configured `GITHUB_API_URL` host: pagination follows page numbers, never absolute URLs from response headers
- Rate limiting to stay within GitHub API quotas; an exhausted quota is reported as a rate limit error
- Input validation with Zod before any external call, including strict `owner/repo` parsing
- Path traversal protection in `get_file_content`

## Tech Stack

Node.js 22+ · ES Modules · MCP SDK · Axios · Zod · Bottleneck · Winston · Jest · ESLint · Prettier · Docker
