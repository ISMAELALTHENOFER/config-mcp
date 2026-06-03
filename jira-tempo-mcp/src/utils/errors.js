export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

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

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}
