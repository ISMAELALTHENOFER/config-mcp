import { AppError } from '@config-mcp/mcp-core';

export class GitlabError extends AppError {
  constructor(message, statusCode = 500) {
    super(`GitLab: ${message}`, statusCode);
    this.name = 'GitlabError';
  }
}
