import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';

describe('config/env', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.GITLAB_BASE_URL;
    delete process.env.GITLAB_PERSONAL_ACCESS_TOKEN;
    delete process.env.MCP_PORT;
    delete process.env.MCP_LOG_LEVEL;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should exit when GITLAB_BASE_URL is missing', async () => {
    process.env.GITLAB_PERSONAL_ACCESS_TOKEN = 'glpat-abc123';
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../../src/config/env.js');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should exit when GITLAB_PERSONAL_ACCESS_TOKEN is missing', async () => {
    process.env.GITLAB_BASE_URL = 'https://gitlab.example.com';
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await import('../../../src/config/env.js');

    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should exit when GITLAB_BASE_URL is not a valid URL', async () => {
    process.env.GITLAB_BASE_URL = 'not-a-url';
    process.env.GITLAB_PERSONAL_ACCESS_TOKEN = 'glpat-abc123';
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await import('../../../src/config/env.js');

    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  it('should exit when MCP_LOG_LEVEL is invalid', async () => {
    process.env.GITLAB_BASE_URL = 'https://gitlab.example.com';
    process.env.GITLAB_PERSONAL_ACCESS_TOKEN = 'glpat-abc123';
    process.env.MCP_LOG_LEVEL = 'invalid';
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await import('../../../src/config/env.js');

    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  it('should use defaults for MCP_PORT and MCP_LOG_LEVEL', async () => {
    process.env.GITLAB_BASE_URL = 'https://gitlab.example.com';
    process.env.GITLAB_PERSONAL_ACCESS_TOKEN = 'glpat-abc123';

    const { env } = await import('../../../src/config/env.js');

    expect(env.MCP_PORT).toBe(3000);
    expect(env.MCP_LOG_LEVEL).toBe('info');
  });

  it('should parse valid env correctly', async () => {
    process.env.GITLAB_BASE_URL = 'https://gitlab.example.com';
    process.env.GITLAB_PERSONAL_ACCESS_TOKEN = 'glpat-abc123';
    process.env.MCP_PORT = '4000';
    process.env.MCP_LOG_LEVEL = 'debug';

    const { env } = await import('../../../src/config/env.js');

    expect(env.GITLAB_BASE_URL).toBe('https://gitlab.example.com');
    expect(env.GITLAB_PERSONAL_ACCESS_TOKEN).toBe('glpat-abc123');
    expect(env.MCP_PORT).toBe(4000);
    expect(env.MCP_LOG_LEVEL).toBe('debug');
  });
});
