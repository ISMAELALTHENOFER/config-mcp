# Jira Tempo MCP Server

MCP (Model Context Protocol) server for Jira and Tempo integration. Enables AI models to query Jira issues, projects, sprints, boards, releases, and Tempo worklogs through a standardized tool interface.

## Features

- Execute JQL queries via `search_jql`
- Get issue details via `get_issue`
- Get project, epic, sprint, board, and release information
- Get blocked issues and user tasks
- Get project metrics (open, in progress, done)
- Get epic progress with hours logged
- Get Tempo worklogs and hours (by issue, user, project, team)
- Rate limiting, input validation, security sanitization

## Quick Start

1. Clone and install:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
TEMPO_API_TOKEN=your-tempo-api-token
MCP_PORT=3000
MCP_LOG_LEVEL=info
```

3. Run:

```bash
npm start
```

## Integration with MCP Clients

### Claude Desktop / Claude Code

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "jira-tempo": {
      "command": "node",
      "args": ["path/to/jira-tempo-mcp/src/server.js"],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-token",
        "TEMPO_API_TOKEN": "your-tempo-token"
      }
    }
  }
}
```

### Cursor

```json
{
  "mcpServers": {
    "jira-tempo": {
      "command": "node",
      "args": ["path/to/jira-tempo-mcp/src/server.js"],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-token",
        "TEMPO_API_TOKEN": "your-tempo-token"
      }
    }
  }
}
```

### Windsurf

```json
{
  "mcpServers": {
    "jira-tempo": {
      "command": "node",
      "args": ["path/to/jira-tempo-mcp/src/server.js"],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-token",
        "TEMPO_API_TOKEN": "your-tempo-token"
      }
    }
  }
}
```

### VSCode MCP (`.vscode/mcp.json`)

```json
{
  "servers": {
    "jira-tempo": {
      "command": "node",
      "args": ["path/to/jira-tempo-mcp/src/server.js"],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-token",
        "TEMPO_API_TOKEN": "your-tempo-token"
      }
    }
  }
}
```

### OpenCode

```json
{
  "mcpServers": {
    "jira-tempo": {
      "command": "node",
      "args": ["path/to/jira-tempo-mcp/src/server.js"],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-token",
        "TEMPO_API_TOKEN": "your-tempo-token"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `search_jql` | Execute JQL queries |
| `get_issue` | Get full issue details |
| `get_project` | Get project information |
| `get_epic` | Get epic and its stories |
| `get_sprint` | Get sprint information |
| `get_board` | Get board information |
| `get_release` | Get project versions/releases |
| `get_my_tasks` | Get tasks assigned to current user |
| `get_blocked_issues` | Get blocked issues |
| `get_project_metrics` | Get project metrics |
| `get_epic_progress` | Get epic progress with hours |
| `get_tempo_worklogs` | Get worklogs for an issue |
| `get_tempo_user_hours` | Get hours by user in date range |
| `get_tempo_project_hours` | Get hours by project in date range |
| `get_tempo_team_hours` | Get hours by team |
| `get_tempo_issue_hours` | Get total hours for an issue |

## Example Queries

```
Show my open tasks
Show tasks assigned to Juan Perez
Search critical bugs in project RENTAX
Show progress of epic RENTAX-100
Show hours logged in Tempo this month
Show tasks in current sprint
Show blocked tasks
Show project metrics
```

## Docker

```bash
docker compose up -d
```

## Development

```bash
# Run with auto-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format code
npm run format
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JIRA_BASE_URL` | Jira instance URL | Yes |
| `JIRA_EMAIL` | Jira account email | Yes |
| `JIRA_API_TOKEN` | Jira API token | Yes |
| `TEMPO_API_TOKEN` | Tempo API token | Yes |
| `MCP_PORT` | Server port (default: 3000) | No |
| `MCP_LOG_LEVEL` | Log level (error/warn/info/debug) | No |

## Security

- Credentials are loaded via `.env` file (excluded from git)
- Sensitive data is never exposed in responses
- All API tokens and passwords are redacted from logs

## Tech Stack

- Node.js 22+
- JavaScript ES Modules
- MCP SDK
- Axios
- Zod
- Bottleneck (rate limiting)
- Winston (logging)
- Jest (testing)
- ESLint + Prettier
- Docker
