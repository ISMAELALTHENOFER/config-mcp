import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const CONFIGS = {
  ro: { name: 'ro', write: false, allowDdl: false },
  rw: { name: 'rw', write: true, allowDdl: false },
  ddl: { name: 'ddl', write: true, allowDdl: true },
};

const mockWithConnection = jest.fn();
jest.unstable_mockModule('../../../src/utils/db.js', () => ({
  withConnection: mockWithConnection,
}));
jest.unstable_mockModule('../../../src/config/connections.js', () => ({
  getConnectionConfig: (name) => {
    const config = CONFIGS[name ?? 'ro'];
    if (!config) throw new Error(`Unknown connection "${name}"`);
    return config;
  },
}));

const { handleExecute } = await import('../../../src/tools/execute.js');

describe('oracle-db execute tool', () => {
  let connection;

  beforeEach(() => {
    jest.clearAllMocks();
    connection = { execute: jest.fn().mockResolvedValue({ rowsAffected: 2 }) };
    mockWithConnection.mockImplementation(async (_name, fn) => fn(connection));
  });

  it('rejects DML on a read-only connection (also the default)', async () => {
    const result = await handleExecute({ sql: 'UPDATE t SET a = 1' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('read-only');
    expect(mockWithConnection).not.toHaveBeenCalled();
  });

  it('runs DML with autoCommit on a write connection', async () => {
    const result = await handleExecute({
      sql: 'UPDATE t SET a = :a',
      binds: { a: 1 },
      connection: 'rw',
    });

    expect(mockWithConnection.mock.calls[0][0]).toBe('rw');
    expect(connection.execute).toHaveBeenCalledWith(
      'UPDATE t SET a = :a',
      { a: 1 },
      { autoCommit: true },
    );
    expect(JSON.parse(result.content[0].text)).toEqual({
      conexion: 'rw',
      tipo_sentencia: 'dml',
      filas_afectadas: 2,
    });
  });

  it('rejects DDL without allowDdl and runs it with allowDdl', async () => {
    const denied = await handleExecute({ sql: 'DROP TABLE t', connection: 'rw' });
    expect(denied.isError).toBe(true);
    expect(denied.content[0].text).toContain('allowDdl');

    const allowed = await handleExecute({ sql: 'DROP TABLE t', connection: 'ddl' });
    expect(allowed.isError).toBeUndefined();
    expect(connection.execute).toHaveBeenCalledTimes(1);
  });

  it.each([
    'BEGIN delete_all; END;',
    'DECLARE x NUMBER; BEGIN NULL; END;',
    'CALL pkg.proc()',
    "/* comment */ EXECUTE IMMEDIATE 'DROP TABLE t'",
  ])('never executes PL/SQL, even with allowDdl: %s', async (sql) => {
    const result = await handleExecute({ sql, connection: 'ddl' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('PL/SQL');
    expect(mockWithConnection).not.toHaveBeenCalled();
  });

  it.each([
    'SELECT * FROM t',
    'UPDATE t SET a = 1; DROP TABLE t',
    'LOCK TABLE t IN EXCLUSIVE MODE',
  ])('rejects reads, multiple statements and unknown statements: %s', async (sql) => {
    const result = await handleExecute({ sql, connection: 'ddl' });

    expect(result.isError).toBe(true);
    expect(mockWithConnection).not.toHaveBeenCalled();
  });

  it('validates without executing on dry_run', async () => {
    const result = await handleExecute({
      sql: 'DELETE FROM t',
      connection: 'rw',
      dry_run: true,
    });

    expect(JSON.parse(result.content[0].text)).toMatchObject({
      tipo_sentencia: 'dml',
      dry_run: true,
      permitido: true,
    });
    expect(mockWithConnection).not.toHaveBeenCalled();
  });

  it('fails on an unknown connection', async () => {
    await expect(
      handleExecute({ sql: 'DELETE FROM t', connection: 'nope' }),
    ).rejects.toThrow('Unknown connection');
  });
});
