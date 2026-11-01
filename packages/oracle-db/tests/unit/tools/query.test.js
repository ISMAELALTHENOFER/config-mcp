import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockWithConnection = jest.fn();
const mockDb = { OUT_FORMAT_OBJECT: 'object', withConnection: mockWithConnection };

jest.unstable_mockModule('../../../src/utils/db.js', () => mockDb);

const { handleQuery } = await import('../../../src/tools/query.js');

describe('oracle-db query tool', () => {
  let connection;

  beforeEach(() => {
    jest.clearAllMocks();
    connection = {
      execute: jest
        .fn()
        .mockResolvedValue({ rows: [{ X: 1 }], metaData: [{ name: 'X' }] }),
    };
    mockWithConnection.mockImplementation(async (_name, fn) => fn(connection));
  });

  it('executes a SELECT with the default row limit on the default connection', async () => {
    const result = await handleQuery({ sql: 'SELECT 1 FROM dual' });

    expect(mockWithConnection.mock.calls[0][0]).toBeUndefined();
    expect(connection.execute).toHaveBeenCalledWith(
      'SELECT 1 FROM dual',
      {},
      { maxRows: 100, outFormat: 'object' },
    );
    expect(result.content[0].text).toContain('"total_filas": 1');
  });

  it('routes the query to the requested connection', async () => {
    await handleQuery({ sql: 'SELECT 1 FROM dual', connection: 'test' });

    expect(mockWithConnection.mock.calls[0][0]).toBe('test');
  });

  it('allows reading PL/SQL source', async () => {
    const result = await handleQuery({
      sql: "SELECT TEXT FROM ALL_SOURCE WHERE NAME = 'PKG'",
    });

    expect(result.isError).toBeUndefined();
  });

  it.each([
    'UPDATE users SET active = 0',
    'WITH changed AS (UPDATE users SET active = 0) SELECT * FROM changed',
    'SELECT * FROM users FOR UPDATE',
    'BEGIN NULL; END;',
    'SELECT 1 FROM dual; DROP TABLE users',
  ])('rejects non-read-only SQL: %s', async (sql) => {
    const result = await handleQuery({ sql });

    expect(result.isError).toBe(true);
    expect(mockWithConnection).not.toHaveBeenCalled();
  });

  it('rejects an invalid limit', async () => {
    const result = await handleQuery({ sql: 'SELECT 1 FROM dual', limit: 1001 });

    expect(result.isError).toBe(true);
    expect(mockWithConnection).not.toHaveBeenCalled();
  });
});
