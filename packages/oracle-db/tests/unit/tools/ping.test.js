import { describe, expect, it, jest } from '@jest/globals';

const mockWithConnection = jest.fn();
const mockDb = { OUT_FORMAT_OBJECT: 'object', withConnection: mockWithConnection };
const config = {
  name: 'test',
  connectString: 'host:1521/svc',
  user: 'reader',
  schema: '',
  write: false,
  allowDdl: false,
};

jest.unstable_mockModule('../../../src/utils/db.js', () => mockDb);
jest.unstable_mockModule('../../../src/config/connections.js', () => ({
  permissionMode: (c) => (c.allowDdl ? 'read+dml+ddl' : c.write ? 'read+dml' : 'read'),
}));

const { handlePing } = await import('../../../src/tools/ping.js');

function useBanner(rows) {
  const connection = { execute: jest.fn().mockResolvedValue({ rows }) };
  mockWithConnection.mockImplementation(async (_name, fn) => fn(connection, config));
}

describe('oracle-db ping tool', () => {
  it('returns connected status, version, connection and permissions', async () => {
    useBanner([{ BANNER: 'Oracle Database 19c Enterprise Edition' }]);

    const result = await handlePing({ connection: 'test' });
    const body = JSON.parse(result.content[0].text);

    expect(body).toMatchObject({
      estado: 'conectado',
      conexion: 'test',
      version: 'Oracle Database 19c Enterprise Edition',
      connectString: 'host:1521/svc',
      esquema: 'READER',
      permisos: 'read',
    });
    expect(mockWithConnection.mock.calls.at(-1)[0]).toBe('test');
  });

  it('returns unknown version when banner is missing', async () => {
    useBanner([]);

    const result = await handlePing();

    expect(result.content[0].text).toContain('"version": "desconocida"');
  });
});
