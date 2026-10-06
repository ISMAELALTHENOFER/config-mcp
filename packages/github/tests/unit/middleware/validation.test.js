import {
  validateRepository,
  validatePullNumber,
  validateUrl,
} from '../../../src/middleware/validation.js';

describe('middleware/validation', () => {
  describe('validateRepository', () => {
    it('should accept owner/repo', () => {
      expect(validateRepository('octo/project')).toBe('octo/project');
    });

    it('should throw for empty string, undefined and null', () => {
      expect(() => validateRepository('')).toThrow();
      expect(() => validateRepository(undefined)).toThrow();
      expect(() => validateRepository(null)).toThrow();
    });
  });

  describe('validatePullNumber', () => {
    it('should accept a positive integer or numeric string', () => {
      expect(validatePullNumber(42)).toBe(42);
      expect(validatePullNumber('42')).toBe(42);
    });

    it('should throw for zero, negative, float and non-numeric', () => {
      expect(() => validatePullNumber(0)).toThrow();
      expect(() => validatePullNumber(-1)).toThrow();
      expect(() => validatePullNumber(1.5)).toThrow();
      expect(() => validatePullNumber('abc')).toThrow();
    });
  });

  describe('validateUrl', () => {
    it('should accept valid URLs', () => {
      expect(validateUrl('https://github.com/octo/project')).toBe(
        'https://github.com/octo/project',
      );
      expect(validateUrl('http://localhost:8080')).toBe('http://localhost:8080');
    });

    it('should throw for empty, invalid and relative URLs', () => {
      expect(() => validateUrl('')).toThrow();
      expect(() => validateUrl('not-a-url')).toThrow();
      expect(() => validateUrl('/relative/path')).toThrow();
    });
  });
});
