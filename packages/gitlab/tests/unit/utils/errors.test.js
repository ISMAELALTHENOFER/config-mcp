import { AppError, ValidationError } from '@config-mcp/mcp-core';
import { GitlabError } from '../../../src/utils/errors.js';

describe('utils/errors', () => {
  describe('AppError', () => {
    it('should create an error with message and default statusCode 500', () => {
      const err = new AppError('Something went wrong');
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('AppError');
      expect(err.message).toBe('Something went wrong');
      expect(err.statusCode).toBe(500);
    });

    it('should create an error with custom statusCode', () => {
      const err = new AppError('Not found', 404);
      expect(err.statusCode).toBe(404);
    });
  });

  describe('GitlabError', () => {
    it('should create an error with "GitLab: " prefix', () => {
      const err = new GitlabError('Resource not found', 404);
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('GitlabError');
      expect(err.message).toBe('GitLab: Resource not found');
      expect(err.statusCode).toBe(404);
    });

    it('should default to statusCode 500', () => {
      const err = new GitlabError('Server error');
      expect(err.statusCode).toBe(500);
    });
  });

  describe('ValidationError', () => {
    it('should create an error with statusCode 400', () => {
      const err = new ValidationError('Invalid input');
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('ValidationError');
      expect(err.message).toBe('Invalid input');
      expect(err.statusCode).toBe(400);
    });
  });
});
