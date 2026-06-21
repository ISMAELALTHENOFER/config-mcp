import {
  validateProjectPath,
  validateMrIid,
  validateUrl,
} from '../../../src/middleware/validation.js';

describe('middleware/validation', () => {
  describe('validateProjectPath', () => {
    it('should accept a valid project path', () => {
      const result = validateProjectPath('group/project');
      expect(result).toBe('group/project');
    });

    it('should accept a nested project path', () => {
      const result = validateProjectPath('group/subgroup/project');
      expect(result).toBe('group/subgroup/project');
    });

    it('should throw for empty string', () => {
      expect(() => validateProjectPath('')).toThrow();
    });

    it('should throw for undefined', () => {
      expect(() => validateProjectPath(undefined)).toThrow();
    });

    it('should throw for null', () => {
      expect(() => validateProjectPath(null)).toThrow();
    });
  });

  describe('validateMrIid', () => {
    it('should accept a positive integer', () => {
      const result = validateMrIid(42);
      expect(result).toBe(42);
    });

    it('should accept a string number', () => {
      const result = validateMrIid('42');
      expect(result).toBe(42);
    });

    it('should throw for zero', () => {
      expect(() => validateMrIid(0)).toThrow();
    });

    it('should throw for negative number', () => {
      expect(() => validateMrIid(-1)).toThrow();
    });

    it('should throw for float', () => {
      expect(() => validateMrIid(1.5)).toThrow();
    });

    it('should throw for non-numeric string', () => {
      expect(() => validateMrIid('abc')).toThrow();
    });
  });

  describe('validateUrl', () => {
    it('should accept a valid HTTPS URL', () => {
      const result = validateUrl('https://gitlab.example.com');
      expect(result).toBe('https://gitlab.example.com');
    });

    it('should accept a valid HTTP URL', () => {
      const result = validateUrl('http://localhost:8080');
      expect(result).toBe('http://localhost:8080');
    });

    it('should throw for empty string', () => {
      expect(() => validateUrl('')).toThrow();
    });

    it('should throw for invalid URL', () => {
      expect(() => validateUrl('not-a-url')).toThrow();
    });

    it('should throw for relative path', () => {
      expect(() => validateUrl('/relative/path')).toThrow();
    });
  });
});
