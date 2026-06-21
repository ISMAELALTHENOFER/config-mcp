export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export class GitlabError extends AppError {
  constructor(message, statusCode = 500) {
    super(`GitLab: ${message}`, statusCode);
    this.name = 'GitlabError';
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}
