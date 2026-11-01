import fs from 'fs';
import { env } from './env.js';

const SCHEMA_NAME = /^[A-Z][A-Z0-9_$#]*$/;

// Replaces ${VAR} with its environment value so connections.json holds no secrets.
function expandEnv(value, source) {
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, name) => {
    if (source[name] === undefined) {
      throw new Error(
        `Environment variable "${name}" referenced in the Oracle configuration is not defined`,
      );
    }
    return source[name];
  });
}

export function normalizeConnection(name, raw, source = process.env) {
  const schema = (expandEnv(raw.schema, source) || '').toUpperCase();
  const allowDdl = raw.allowDdl === true;
  const connection = {
    name,
    label: expandEnv(raw.label, source) || name,
    user: expandEnv(raw.user, source),
    password: expandEnv(raw.password, source),
    connectString: expandEnv(raw.connectString, source),
    schema,
    // allowDdl implies write; PL/SQL execution is never allowed.
    write: raw.write === true || allowDdl,
    allowDdl,
  };

  for (const field of ['user', 'password', 'connectString']) {
    if (!connection[field]) {
      throw new Error(`Connection "${name}": missing required field "${field}"`);
    }
  }
  // The schema is interpolated into ALTER SESSION, so it must be a plain identifier.
  if (schema && !SCHEMA_NAME.test(schema)) {
    throw new Error(`Connection "${name}": invalid schema "${schema}"`);
  }
  return connection;
}

export function loadConnections(configPath, source = process.env) {
  if (!fs.existsSync(configPath)) {
    if (!source.ORACLE_USER) {
      throw new Error(
        `No Oracle configuration: create ${configPath} (see connections.example.json) or set ORACLE_USER, ORACLE_PASSWORD and ORACLE_CONNECT_STRING`,
      );
    }
    return {
      connections: {
        default: normalizeConnection(
          'default',
          {
            label: 'Connection from ORACLE_* environment variables',
            user: source.ORACLE_USER,
            password: source.ORACLE_PASSWORD,
            connectString: source.ORACLE_CONNECT_STRING,
          },
          source,
        ),
      },
      defaultConnection: 'default',
    };
  }

  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const names = Object.keys(raw.connections ?? {});
  if (names.length === 0) {
    throw new Error(`${configPath} defines no connections`);
  }

  const connections = {};
  for (const name of names) {
    connections[name] = normalizeConnection(name, raw.connections[name], source);
  }

  const defaultConnection = raw.defaultConnection || names[0];
  if (!connections[defaultConnection]) {
    throw new Error(
      `defaultConnection "${defaultConnection}" is not a defined connection`,
    );
  }
  return { connections, defaultConnection };
}

let loaded;
try {
  loaded = loadConnections(env.ORACLE_MCP_CONFIG);
} catch (error) {
  console.error(`Invalid Oracle configuration (oracle-db): ${error.message}`);
  process.exit(1);
}

export const CONNECTIONS = loaded.connections;
export const DEFAULT_CONNECTION = loaded.defaultConnection;

export function getConnectionConfig(name) {
  const key = name || DEFAULT_CONNECTION;
  const connection = CONNECTIONS[key];
  if (!connection) {
    throw new Error(
      `Unknown connection "${key}". Available: ${Object.keys(CONNECTIONS).join(', ')}`,
    );
  }
  return connection;
}

export function permissionMode(connection) {
  if (connection.allowDdl) return 'read+dml+ddl';
  return connection.write ? 'read+dml' : 'read';
}
