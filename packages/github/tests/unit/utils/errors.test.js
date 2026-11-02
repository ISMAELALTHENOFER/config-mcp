import { AppError, ValidationError } from '@config-mcp/mcp-core';
import { GithubError } from '../../../src/utils/errors.js';

describe('utils/errors', () => {
  describe('GithubError', () => {
    it('should create an error with "GitHub: " prefix', () => {
      const err = new GithubError('Resource not found', 404);
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('GithubError');
      expect(err.message).toBe('GitHub: Resource not found');
      expect(err.statusCode).toBe(404);
    });

    it('should default to statusCode 500', () => {
      const err = new GithubError('Server error');
      expect(err.statusCode).toBe(500);
    });
  });

  describe('ValidationError', () => {
    it('should create an error with statusCode 400', () => {
      const err = new ValidationError('Invalid input');
      expect(err).toBeInstanceOf(AppError);
      expect(err.name).toBe('ValidationError');
      expect(err.statusCode).toBe(400);
    });
  });
});
