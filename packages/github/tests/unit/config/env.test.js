import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';

describe('config/env', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.unstable_mockModule('dotenv', () => ({
      default: { config: jest.fn() },
    }));
    process.env = { ...OLD_ENV };
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_API_URL;
    delete process.env.MCP_PORT;
    delete process.env.MCP_LOG_LEVEL;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should exit when GITHUB_TOKEN is missing', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../../src/config/env.js');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should exit when GITHUB_API_URL is not a valid URL', async () => {
    process.env.GITHUB_TOKEN = 'ghp_abc123';
    process.env.GITHUB_API_URL = 'not-a-url';
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await import('../../../src/config/env.js');

    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  it('should exit when MCP_LOG_LEVEL is invalid', async () => {
    process.env.GITHUB_TOKEN = 'ghp_abc123';
    process.env.MCP_LOG_LEVEL = 'invalid';
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await import('../../../src/config/env.js');

    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  it('should use defaults for GITHUB_API_URL, MCP_PORT and MCP_LOG_LEVEL', async () => {
    process.env.GITHUB_TOKEN = 'ghp_abc123';

    const { env } = await import('../../../src/config/env.js');

    expect(env.GITHUB_API_URL).toBe('https://api.github.com');
    expect(env.MCP_PORT).toBe(3000);
    expect(env.MCP_LOG_LEVEL).toBe('info');
  });

  it('should parse valid env correctly (GitHub Enterprise URL)', async () => {
    process.env.GITHUB_TOKEN = 'ghp_abc123';
    process.env.GITHUB_API_URL = 'https://ghe.example.com/api/v3';
    process.env.MCP_PORT = '4000';
    process.env.MCP_LOG_LEVEL = 'debug';

    const { env } = await import('../../../src/config/env.js');

    expect(env.GITHUB_TOKEN).toBe('ghp_abc123');
    expect(env.GITHUB_API_URL).toBe('https://ghe.example.com/api/v3');
    expect(env.MCP_PORT).toBe(4000);
    expect(env.MCP_LOG_LEVEL).toBe('debug');
  });
});
