const REPOSITORY_PROPERTY = {
  type: 'string',
  description: 'Repository as "owner/repo" or a GitHub repository URL',
};

const PULL_NUMBER_PROPERTY = {
  type: 'number',
  description: 'Pull request number',
};

const GET_PULL_REQUEST_SCHEMA = {
  name: 'get_pull_request',
  description:
    'Get pull request details by URL, or by repository and pull request number',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Full GitHub PR URL (e.g. https://github.com/owner/repo/pull/42)',
      },
      repository: REPOSITORY_PROPERTY,
      pullNumber: PULL_NUMBER_PROPERTY,
    },
  },
};

const GET_PULL_REQUEST_FILES_SCHEMA = {
  name: 'get_pull_request_files',
  description:
    'Get changed files and patches in a pull request (patchOmitted flags files whose patch text GitHub did not return)',
  inputSchema: {
    type: 'object',
    properties: {
      repository: REPOSITORY_PROPERTY,
      pullNumber: PULL_NUMBER_PROPERTY,
    },
    required: ['repository', 'pullNumber'],
  },
};

const GET_PULL_REQUEST_COMMENTS_SCHEMA = {
  name: 'get_pull_request_comments',
  description: 'Get conversation comments and inline review threads of a pull request',
  inputSchema: {
    type: 'object',
    properties: {
      repository: REPOSITORY_PROPERTY,
      pullNumber: PULL_NUMBER_PROPERTY,
    },
    required: ['repository', 'pullNumber'],
  },
};

const GET_PULL_REQUEST_REVIEWS_SCHEMA = {
  name: 'get_pull_request_reviews',
  description: 'Get reviews and approval state of a pull request',
  inputSchema: {
    type: 'object',
    properties: {
      repository: REPOSITORY_PROPERTY,
      pullNumber: PULL_NUMBER_PROPERTY,
    },
    required: ['repository', 'pullNumber'],
  },
};

const GET_PULL_REQUEST_CHECKS_SCHEMA = {
  name: 'get_pull_request_checks',
  description: 'Get CI check runs for the head commit of a pull request',
  inputSchema: {
    type: 'object',
    properties: {
      repository: REPOSITORY_PROPERTY,
      pullNumber: PULL_NUMBER_PROPERTY,
    },
    required: ['repository', 'pullNumber'],
  },
};

const LIST_PULL_REQUESTS_SCHEMA = {
  name: 'list_pull_requests',
  description: 'List pull requests of a repository with optional filters',
  inputSchema: {
    type: 'object',
    properties: {
      repository: REPOSITORY_PROPERTY,
      state: {
        type: 'string',
        description: 'Filter by state (open, closed, merged, all)',
        enum: ['open', 'closed', 'merged', 'all'],
      },
      base: {
        type: 'string',
        description: 'Filter by base (target) branch name',
      },
      head: {
        type: 'string',
        description: 'Filter by head branch as "user:branch" or "org:branch"',
      },
      labels: {
        type: 'string',
        description: 'Comma-separated list of label names; all must be present',
      },
    },
    required: ['repository'],
  },
};

const GET_REPOSITORY_SCHEMA = {
  name: 'get_repository',
  description: 'Get repository details',
  inputSchema: {
    type: 'object',
    properties: {
      repository: REPOSITORY_PROPERTY,
    },
    required: ['repository'],
  },
};

const LIST_BRANCHES_SCHEMA = {
  name: 'list_branches',
  description: 'List repository branches with optional name search',
  inputSchema: {
    type: 'object',
    properties: {
      repository: REPOSITORY_PROPERTY,
      search: {
        type: 'string',
        description: 'Case-insensitive text the branch name must contain',
      },
    },
    required: ['repository'],
  },
};

const GET_FILE_CONTENT_SCHEMA = {
  name: 'get_file_content',
  description: 'Get file content from a repository',
  inputSchema: {
    type: 'object',
    properties: {
      repository: REPOSITORY_PROPERTY,
      filePath: {
        type: 'string',
        description: 'Path to the file in the repository',
      },
      ref: {
        type: 'string',
        description: 'Branch name, tag, or commit SHA (default: default branch)',
      },
    },
    required: ['repository', 'filePath'],
  },
};

export const ALL_TOOLS = [
  GET_REPOSITORY_SCHEMA,
  LIST_PULL_REQUESTS_SCHEMA,
  GET_PULL_REQUEST_SCHEMA,
  GET_PULL_REQUEST_FILES_SCHEMA,
  GET_PULL_REQUEST_COMMENTS_SCHEMA,
  GET_PULL_REQUEST_REVIEWS_SCHEMA,
  GET_PULL_REQUEST_CHECKS_SCHEMA,
  LIST_BRANCHES_SCHEMA,
  GET_FILE_CONTENT_SCHEMA,
];
