import { afterAll, describe, expect, it, jest } from '@jest/globals';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const dir = mkdtempSync(join(tmpdir(), 'oracle-db-config-'));
const configPath = join(dir, 'connections.json');
const missingPath = join(dir, 'missing.json');

function writeConfig(content) {
  writeFileSync(configPath, JSON.stringify(content));
}

writeConfig({
  defaultConnection: 'test',
  connections: {
    dev: { user: 'u', password: 'p', connectString: 'h/s' },
    test: { user: 'u', password: 'p', connectString: 'h/s', write: true },
  },
});

jest.unstable_mockModule('../../../src/config/env.js', () => ({
  env: { ORACLE_MCP_CONFIG: configPath, MCP_LOG_LEVEL: 'error' },
}));

const { loadConnections, getConnectionConfig, permissionMode, DEFAULT_CONNECTION } =
  await import('../../../src/config/connections.js');

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('oracle-db connections config', () => {
  it('loads the configured connections and resolves the default one', () => {
    expect(DEFAULT_CONNECTION).toBe('test');
    expect(getConnectionConfig().name).toBe('test');
    expect(getConnectionConfig('dev').name).toBe('dev');
    expect(() => getConnectionConfig('nope')).toThrow(
      'Unknown connection "nope". Available: dev, test',
    );
  });

  it('interpolates ${VAR}, uppercases the schema and defaults to read-only', () => {
    writeConfig({
      connections: {
        a: {
          user: '${U}',
          password: '${P}',
          connectString: 'host:${PORT}/svc',
          schema: 'siat',
        },
      },
    });

    const { connections, defaultConnection } = loadConnections(configPath, {
      U: 'user',
      P: 'secret',
      PORT: '1521',
    });

    expect(defaultConnection).toBe('a');
    expect(connections.a).toMatchObject({
      user: 'user',
      password: 'secret',
      connectString: 'host:1521/svc',
      schema: 'SIAT',
      write: false,
      allowDdl: false,
    });
    expect(permissionMode(connections.a)).toBe('read');
  });

  it('maps permission flags: write is DML, allowDdl implies write', () => {
    writeConfig({
      connections: {
        rw: { user: 'u', password: 'p', connectString: 'h/s', write: true },
        ddl: { user: 'u', password: 'p', connectString: 'h/s', allowDdl: true },
        truthy: { user: 'u', password: 'p', connectString: 'h/s', write: 'true' },
      },
    });

    const { connections } = loadConnections(configPath, {});

    expect(permissionMode(connections.rw)).toBe('read+dml');
    expect(permissionMode(connections.ddl)).toBe('read+dml+ddl');
    expect(connections.ddl.write).toBe(true);
    expect(permissionMode(connections.truthy)).toBe('read');
  });

  it.each([
    [{ connections: {} }, 'defines no connections'],
    [
      { connections: { a: { user: 'u', connectString: 'h/s' } } },
      'missing required field "password"',
    ],
    [
      { connections: { a: { user: '${NOPE}', password: 'p', connectString: 'h/s' } } },
      '"NOPE"',
    ],
    [
      {
        defaultConnection: 'x',
        connections: { a: { user: 'u', password: 'p', connectString: 'h/s' } },
      },
      '"x"',
    ],
    [
      {
        connections: {
          a: { user: 'u', password: 'p', connectString: 'h/s', schema: 'X; DROP' },
        },
      },
      'invalid schema',
    ],
  ])('rejects invalid configuration %#', (content, message) => {
    writeConfig(content);

    expect(() => loadConnections(configPath, {})).toThrow(message);
  });

  it('falls back to a read-only default connection from ORACLE_* variables', () => {
    const { connections, defaultConnection } = loadConnections(missingPath, {
      ORACLE_USER: 'user',
      ORACLE_PASSWORD: 'secret',
      ORACLE_CONNECT_STRING: 'host:1521/svc',
    });

    expect(defaultConnection).toBe('default');
    expect(connections.default).toMatchObject({
      user: 'user',
      connectString: 'host:1521/svc',
      write: false,
    });
  });

  it('fails without a configuration file or ORACLE_USER', () => {
    expect(() => loadConnections(missingPath, {})).toThrow('No Oracle configuration');
  });
});
