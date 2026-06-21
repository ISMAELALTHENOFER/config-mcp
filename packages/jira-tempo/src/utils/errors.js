import { AppError } from '@config-mcp/mcp-core';

export class JiraError extends AppError {
  constructor(message, statusCode = 500) {
    super(`Jira: ${message}`, statusCode);
    this.name = 'JiraError';
  }
}

export class TempoError extends AppError {
  constructor(message, statusCode = 500) {
    super(`Tempo: ${message}`, statusCode);
    this.name = 'TempoError';
  }
}
