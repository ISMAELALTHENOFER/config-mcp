import { withConnection, OUT_FORMAT_OBJECT } from '../utils/db.js';
import { env } from '../config/env.js';

export const pingSchema = {};

export async function handlePing() {
  const result = await withConnection((conn) =>
    conn.execute(
      "SELECT BANNER FROM V$VERSION WHERE ROWNUM = 1",
      {},
      { outFormat: OUT_FORMAT_OBJECT },
    ),
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            estado: 'conectado',
            version: result.rows[0]?.BANNER ?? 'desconocida',
            connectString: env.ORACLE_CONNECT_STRING,
          },
          null,
          2,
        ),
      },
    ],
  };
}
