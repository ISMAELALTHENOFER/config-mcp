import oracledb from 'oracledb';
import { getConnectionConfig } from '../config/connections.js';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

export const OUT_FORMAT_OBJECT = oracledb.OUT_FORMAT_OBJECT;

const pools = new Map();

async function getPool(config) {
  if (!pools.has(config.name)) {
    pools.set(
      config.name,
      oracledb.createPool({
        user: config.user,
        password: config.password,
        connectString: config.connectString,
        poolMin: 1,
        poolMax: 5,
        poolIncrement: 1,
        // Position every session in the working schema so tables need no prefix.
        sessionCallback: async (connection, _requestedTag, callback) => {
          try {
            if (config.schema) {
              await connection.execute(
                `ALTER SESSION SET CURRENT_SCHEMA = ${config.schema}`,
              );
            }
            callback();
          } catch (error) {
            callback(error);
          }
        },
      }),
    );
  }
  try {
    return await pools.get(config.name);
  } catch (error) {
    pools.delete(config.name); // let the next call retry a failed pool creation
    throw error;
  }
}

export async function withConnection(connectionName, fn) {
  const config = getConnectionConfig(connectionName);
  const pool = await getPool(config);
  const connection = await pool.getConnection();
  try {
    return await fn(connection, config);
  } finally {
    await connection.close();
  }
}
