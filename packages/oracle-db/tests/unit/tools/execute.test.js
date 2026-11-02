import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const CONFIGS = {
  ro: { name: 'ro', permissions: ['select'] },
  upd: { name: 'upd', permissions: ['select', 'update'] },
  all: {
    name: 'all',
    permissions: ['select', 'insert', 'update', 'delete', 'merge', 'ddl'],
  },
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

  it('rejects any write on a select-only connection (also the default)', async () => {
    const result = await handleExecute({ sql: 'UPDATE t SET a = 1' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('does not allow UPDATE (allowed: select)');
    expect(mockWithConnection).not.toHaveBeenCalled();
  });

  it('runs an allowed statement type with autoCommit on the requested connection', async () => {
    const result = await handleExecute({
      sql: 'UPDATE t SET a = :a',
      binds: { a: 1 },
      connection: 'upd',
    });

    expect(mockWithConnection.mock.calls[0][0]).toBe('upd');
    expect(connection.execute).toHaveBeenCalledWith(
      'UPDATE t SET a = :a',
      { a: 1 },
      { autoCommit: true },
    );
    expect(JSON.parse(result.content[0].text)).toEqual({
      conexion: 'upd',
      tipo_sentencia: 'update',
      filas_afectadas: 2,
    });
  });

  it.each([
    'INSERT INTO t VALUES (1)',
    'DELETE FROM t',
    'MERGE INTO t USING s ON (1=1) WHEN MATCHED THEN UPDATE SET a = 1',
    'DROP TABLE t',
  ])('rejects statement types the connection does not list: %s', async (sql) => {
    const result = await handleExecute({ sql, connection: 'upd' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('does not allow');
    expect(mockWithConnection).not.toHaveBeenCalled();
  });

  it('runs DDL only when the connection lists ddl', async () => {
    const result = await handleExecute({ sql: 'DROP TABLE t', connection: 'all' });

    expect(result.isError).toBeUndefined();
    expect(connection.execute).toHaveBeenCalledTimes(1);
  });

  it.each([
    'BEGIN delete_all; END;',
    'DECLARE x NUMBER; BEGIN NULL; END;',
    'CALL pkg.proc()',
    "/* comment */ EXECUTE IMMEDIATE 'DROP TABLE t'",
    "INSERT /*+ WITH_PLSQL */ INTO t WITH FUNCTION f RETURN NUMBER IS s VARCHAR2(9) := '--'; PRAGMA AUTONOMOUS_TRANSACTION; BEGIN EXECUTE IMMEDIATE 'DROP TABLE x'; COMMIT; RETURN 1; END; SELECT f FROM dual",
  ])('never executes PL/SQL, even with every permission: %s', async (sql) => {
    const result = await handleExecute({ sql, connection: 'all' });

    expect(result.isError).toBe(true);
    expect(mockWithConnection).not.toHaveBeenCalled();
  });

  it.each([
    'SELECT * FROM t',
    'UPDATE t SET a = 1; DROP TABLE t',
    "INSERT /*+ WITH_PLSQL */ INTO t --\rWITH FUNCTION f RETURN NUMBER IS BEGIN EXECUTE IMMEDIATE 'DROP TABLE x'; RETURN 1; END; SELECT f FROM dual",
    "UPDATE t SET a = '--'; DROP TABLE t",
    'LOCK TABLE t IN EXCLUSIVE MODE',
    "UPDATE t SET a = 'unterminated",
  ])('rejects reads, multiple statements and unknown statements: %s', async (sql) => {
    const result = await handleExecute({ sql, connection: 'all' });

    expect(result.isError).toBe(true);
    expect(mockWithConnection).not.toHaveBeenCalled();
  });

  it('allows keywords and separators inside string literals', async () => {
    const result = await handleExecute({
      sql: "UPDATE t SET note = 'drop; -- begin' WHERE id = 1",
      connection: 'upd',
    });

    expect(result.isError).toBeUndefined();
  });

  it('validates without executing on dry_run', async () => {
    const result = await handleExecute({
      sql: 'UPDATE t SET a = 1',
      connection: 'upd',
      dry_run: true,
    });

    expect(JSON.parse(result.content[0].text)).toMatchObject({
      tipo_sentencia: 'update',
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
