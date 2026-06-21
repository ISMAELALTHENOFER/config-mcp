const GET_MR_SCHEMA = {
  name: 'get_mr',
  description: 'Get merge request details by URL, project ID, or MR IID',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Full GitLab MR URL (e.g. https://gitlab.example.com/group/project/-/merge_requests/42)',
      },
      projectId: {
        type: 'string',
        description: 'Project ID or URL-encoded path (e.g. "group/project" or "42")',
      },
      mrIid: {
        type: 'number',
        description: 'Merge request IID',
      },
    },
  },
};

const GET_MR_DIFFS_SCHEMA = {
  name: 'get_mr_diffs',
  description: 'Get file changes/diffs in a merge request',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID or URL-encoded path',
      },
      mrIid: {
        type: 'number',
        description: 'Merge request IID',
      },
    },
    required: ['projectId', 'mrIid'],
  },
};

const GET_MR_COMMENTS_SCHEMA = {
  name: 'get_mr_comments',
  description: 'Get discussion comments on a merge request',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID or URL-encoded path',
      },
      mrIid: {
        type: 'number',
        description: 'Merge request IID',
      },
    },
    required: ['projectId', 'mrIid'],
  },
};

const GET_MR_APPROVALS_SCHEMA = {
  name: 'get_mr_approvals',
  description: 'Get approval state of a merge request',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID or URL-encoded path',
      },
      mrIid: {
        type: 'number',
        description: 'Merge request IID',
      },
    },
    required: ['projectId', 'mrIid'],
  },
};

const GET_MR_PIPELINES_SCHEMA = {
  name: 'get_mr_pipelines',
  description: 'Get CI/CD pipelines for a merge request',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID or URL-encoded path',
      },
      mrIid: {
        type: 'number',
        description: 'Merge request IID',
      },
    },
    required: ['projectId', 'mrIid'],
  },
};

const LIST_PROJECT_MRS_SCHEMA = {
  name: 'list_project_mrs',
  description: 'List merge requests for a project with optional filters',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID or URL-encoded path',
      },
      state: {
        type: 'string',
        description: 'Filter by state (opened, closed, merged, all)',
        enum: ['opened', 'closed', 'merged', 'all'],
      },
      labels: {
        type: 'string',
        description: 'Comma-separated list of label names to filter by',
      },
      search: {
        type: 'string',
        description: 'Search string for MR title or description',
      },
    },
    required: ['projectId'],
  },
};

const GET_PROJECT_SCHEMA = {
  name: 'get_project',
  description: 'Get project details by path',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Project path (e.g. "group/project" or "group/subgroup/project")',
      },
    },
    required: ['projectPath'],
  },
};

const LIST_BRANCHES_SCHEMA = {
  name: 'list_branches',
  description: 'List repository branches with optional search',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID or URL-encoded path',
      },
      search: {
        type: 'string',
        description: 'Search pattern for branch names',
      },
    },
    required: ['projectId'],
  },
};

const GET_FILE_CONTENT_SCHEMA = {
  name: 'get_file_content',
  description: 'Get file content from a repository',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID or URL-encoded path',
      },
      filePath: {
        type: 'string',
        description: 'Path to the file in the repository',
      },
      ref: {
        type: 'string',
        description: 'Branch name, tag, or commit SHA (default: default branch)',
      },
    },
    required: ['projectId', 'filePath'],
  },
};

export const ALL_TOOLS = [
  GET_MR_SCHEMA,
  GET_MR_DIFFS_SCHEMA,
  GET_MR_COMMENTS_SCHEMA,
  GET_MR_APPROVALS_SCHEMA,
  GET_MR_PIPELINES_SCHEMA,
  LIST_PROJECT_MRS_SCHEMA,
  GET_PROJECT_SCHEMA,
  LIST_BRANCHES_SCHEMA,
  GET_FILE_CONTENT_SCHEMA,
];
