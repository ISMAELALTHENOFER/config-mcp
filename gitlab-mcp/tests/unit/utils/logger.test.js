import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import winston from 'winston';

jest.unstable_mockModule('../../../src/config/env.js', () => ({
  env: {
    MCP_LOG_LEVEL: 'debug',
  },
}));

const { logger } = await import('../../../src/utils/logger.js');

describe('utils/logger', () => {
  it('should create a logger with service name "gitlab-mcp"', () => {
    expect(logger).toBeDefined();
    expect(logger.level).toBe('debug');
    expect(logger.defaultMeta).toEqual({ service: 'gitlab-mcp' });
  });

  it('should have info, warn, error, debug methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should log a message without throwing', () => {
    expect(() => {
      logger.info('test message');
    }).not.toThrow();
  });

  it('should create a Console transport', () => {
    // winston.createLogger is called once at module evaluation time.
    // Verify the logger has a Console transport configured.
    const transports = logger.transports;
    expect(transports.length).toBe(1);
    expect(transports[0]).toBeInstanceOf(winston.transports.Console);
  });
});
