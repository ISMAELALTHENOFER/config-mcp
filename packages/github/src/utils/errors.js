import { AppError } from '@config-mcp/mcp-core';

export class GithubError extends AppError {
  constructor(message, statusCode = 500) {
    super(`GitHub: ${message}`, statusCode);
    this.name = 'GithubError';
  }
}
