import { describe, expect, it, jest } from '@jest/globals';

const mockWithConnection = jest.fn();
const mockDb = { OUT_FORMAT_OBJECT: 'object', withConnection: mockWithConnection };
const mockEnv = {
  ORACLE_CONNECT_STRING: 'host:1521/svc',
  ORACLE_USER: 'user',
  ORACLE_PASSWORD: 'password',
  MCP_LOG_LEVEL: 'info',
};

jest.unstable_mockModule('../../../src/utils/db.js', () => mockDb);
jest.unstable_mockModule('../../../src/config/env.js', () => ({ env: mockEnv }));

const { handlePing } = await import('../../../src/tools/ping.js');

describe('oracle-db-test ping tool', () => {
  it('returns connected status with server version', async () => {
    const connection = {
      execute: jest.fn().mockResolvedValue({
        rows: [{ BANNER: 'Oracle Database 19c Enterprise Edition' }],
      }),
    };
    mockWithConnection.mockImplementation(async (fn) => fn(connection));

    const result = await handlePing();

    expect(result.content[0].text).toContain('"estado": "conectado"');
    expect(result.content[0].text).toContain('Oracle Database 19c');
    expect(mockWithConnection).toHaveBeenCalledTimes(1);
  });

  it('returns unknown version when banner is missing', async () => {
    const connection = {
      execute: jest.fn().mockResolvedValue({ rows: [] }),
    };
    mockWithConnection.mockImplementation(async (fn) => fn(connection));

    const result = await handlePing();

    expect(result.content[0].text).toContain('"version": "desconocida"');
  });
});
