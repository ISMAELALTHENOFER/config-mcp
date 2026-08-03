import oracledb from 'oracledb';
import { env } from '../config/env.js';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
export const OUT_FORMAT_OBJECT = oracledb.OUT_FORMAT_OBJECT;

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await oracledb.createPool({
      user: env.ORACLE_USER,
      password: env.ORACLE_PASSWORD,
      connectString: env.ORACLE_CONNECT_STRING,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1,
    });
  }
  return pool;
}

export async function withConnection(fn) {
  const connectionPool = await getPool();
  const connection = await connectionPool.getConnection();
  try {
    return await fn(connection);
  } finally {
    await connection.close();
  }
}
