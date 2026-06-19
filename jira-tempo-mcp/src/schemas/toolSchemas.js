export const SEARCH_JQL_SCHEMA = {
  name: 'search_jql',
  description: 'Execute JQL queries to search Jira issues',
  inputSchema: {
    type: 'object',
    properties: {
      jql: { type: 'string', description: 'JQL query string' },
      maxResults: {
        type: 'number',
        description: 'Maximum results (1-500)',
        default: 50,
      },
    },
    required: ['jql'],
  },
};

export const GET_ISSUE_SCHEMA = {
  name: 'get_issue',
  description: 'Get full details of a Jira issue',
  inputSchema: {
    type: 'object',
    properties: {
      issueKey: { type: 'string', description: 'Issue key (e.g. RENTAX-123)' },
    },
    required: ['issueKey'],
  },
};

export const GET_PROJECT_SCHEMA = {
  name: 'get_project',
  description: 'Get Jira project information',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: { type: 'string', description: 'Project key (e.g. RENTAX)' },
    },
    required: ['projectKey'],
  },
};

export const GET_EPIC_SCHEMA = {
  name: 'get_epic',
  description: 'Get epic details and all its stories',
  inputSchema: {
    type: 'object',
    properties: {
      epicKey: { type: 'string', description: 'Epic key (e.g. RENTAX-100)' },
    },
    required: ['epicKey'],
  },
};

export const GET_SPRINT_SCHEMA = {
  name: 'get_sprint',
  description: 'Get sprint information',
  inputSchema: {
    type: 'object',
    properties: {
      sprintId: { type: 'number', description: 'Sprint ID' },
    },
    required: ['sprintId'],
  },
};

export const GET_BOARD_SCHEMA = {
  name: 'get_board',
  description: 'Get board information',
  inputSchema: {
    type: 'object',
    properties: {
      boardId: { type: 'number', description: 'Board ID' },
    },
    required: ['boardId'],
  },
};

export const GET_RELEASE_SCHEMA = {
  name: 'get_release',
  description: 'Get release/version information for a project',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: { type: 'string', description: 'Project key (e.g. RENTAX)' },
    },
    required: ['projectKey'],
  },
};

export const GET_MY_TASKS_SCHEMA = {
  name: 'get_my_tasks',
  description: 'Get tasks assigned to the current user',
  inputSchema: {
    type: 'object',
    properties: {
      maxResults: {
        type: 'number',
        description: 'Maximum results (1-500)',
        default: 50,
      },
    },
  },
};

export const GET_BLOCKED_ISSUES_SCHEMA = {
  name: 'get_blocked_issues',
  description: 'Get all blocked issues',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: {
        type: 'string',
        description: 'Optional project key to filter',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum results (1-500)',
        default: 50,
      },
    },
  },
};

export const GET_PROJECT_METRICS_SCHEMA = {
  name: 'get_project_metrics',
  description: 'Get project metrics (open, in progress, done counts)',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: { type: 'string', description: 'Project key (e.g. RENTAX)' },
    },
    required: ['projectKey'],
  },
};

export const GET_EPIC_PROGRESS_SCHEMA = {
  name: 'get_epic_progress',
  description: 'Get epic progress including stories completed and hours logged',
  inputSchema: {
    type: 'object',
    properties: {
      epicKey: { type: 'string', description: 'Epic key (e.g. RENTAX-100)' },
    },
    required: ['epicKey'],
  },
};

export const GET_TEMPO_WORKLOGS_SCHEMA = {
  name: 'get_tempo_worklogs',
  description: 'Get worklogs for a specific issue from Tempo',
  inputSchema: {
    type: 'object',
    properties: {
      issueKey: { type: 'string', description: 'Issue key (e.g. RENTAX-123)' },
    },
    required: ['issueKey'],
  },
};

export const GET_TEMPO_USER_HOURS_SCHEMA = {
  name: 'get_tempo_user_hours',
  description: 'Get hours logged by a user in a date range',
  inputSchema: {
    type: 'object',
    properties: {
      accountId: { type: 'string', description: 'User account ID' },
      from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
      to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
    },
    required: ['accountId', 'from', 'to'],
  },
};

export const GET_TEMPO_PROJECT_HOURS_SCHEMA = {
  name: 'get_tempo_project_hours',
  description: 'Get hours logged for a project in a date range',
  inputSchema: {
    type: 'object',
    properties: {
      projectKey: { type: 'string', description: 'Project key (e.g. RENTAX)' },
      from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
      to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
    },
    required: ['projectKey', 'from', 'to'],
  },
};

export const GET_TEMPO_TEAM_HOURS_SCHEMA = {
  name: 'get_tempo_team_hours',
  description: 'Get hours logged for a team',
  inputSchema: {
    type: 'object',
    properties: {
      teamId: { type: 'number', description: 'Team ID' },
    },
    required: ['teamId'],
  },
};

export const GET_TEMPO_ISSUE_HOURS_SCHEMA = {
  name: 'get_tempo_issue_hours',
  description: 'Get total hours logged for a specific issue',
  inputSchema: {
    type: 'object',
    properties: {
      issueKey: { type: 'string', description: 'Issue key (e.g. RENTAX-123)' },
    },
    required: ['issueKey'],
  },
};

export const GET_ISSUE_COMMENTS_SCHEMA = {
  name: 'get_issue_comments',
  description: 'Get all comments from a Jira issue (read-only)',
  inputSchema: {
    type: 'object',
    properties: {
      issueKey: { type: 'string', description: 'Issue key (e.g. REM-12934)' },
    },
    required: ['issueKey'],
  },
};

export const ALL_TOOLS = [
  SEARCH_JQL_SCHEMA,
  GET_ISSUE_SCHEMA,
  GET_PROJECT_SCHEMA,
  GET_EPIC_SCHEMA,
  GET_SPRINT_SCHEMA,
  GET_BOARD_SCHEMA,
  GET_RELEASE_SCHEMA,
  GET_MY_TASKS_SCHEMA,
  GET_BLOCKED_ISSUES_SCHEMA,
  GET_PROJECT_METRICS_SCHEMA,
  GET_EPIC_PROGRESS_SCHEMA,
  GET_ISSUE_COMMENTS_SCHEMA,
  GET_TEMPO_WORKLOGS_SCHEMA,
  GET_TEMPO_USER_HOURS_SCHEMA,
  GET_TEMPO_PROJECT_HOURS_SCHEMA,
  GET_TEMPO_TEAM_HOURS_SCHEMA,
  GET_TEMPO_ISSUE_HOURS_SCHEMA,
];
