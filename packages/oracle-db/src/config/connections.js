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

// Statement types a connection may allow. PL/SQL execution is never allowed.
export const PERMISSIONS = ['select', 'insert', 'update', 'delete', 'merge', 'ddl'];

function parsePermissions(name, raw) {
  if ('write' in raw || 'allowDdl' in raw) {
    throw new Error(
      `Connection "${name}": "write"/"allowDdl" are not supported; use "permissions", e.g. ["select", "update"]`,
    );
  }
  const requested = raw.permissions ?? ['select'];
  if (!Array.isArray(requested)) {
    throw new Error(`Connection "${name}": "permissions" must be an array`);
  }
  const values = requested.map((value) => String(value).toLowerCase());
  const invalid = values.filter((value) => !PERMISSIONS.includes(value));
  if (invalid.length > 0) {
    throw new Error(
      `Connection "${name}": invalid permissions ${invalid.join(', ')}. Allowed: ${PERMISSIONS.join(', ')}`,
    );
  }
  // select is always allowed so every connection can be inspected.
  return PERMISSIONS.filter((value) => value === 'select' || values.includes(value));
}

export function normalizeConnection(name, raw, source = process.env) {
  const schema = (expandEnv(raw.schema, source) || '').toUpperCase();
  const connection = {
    name,
    label: expandEnv(raw.label, source) || name,
    user: expandEnv(raw.user, source),
    password: expandEnv(raw.password, source),
    connectString: expandEnv(raw.connectString, source),
    schema,
    permissions: parsePermissions(name, raw),
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
  return connection.permissions.join(', ');
}
