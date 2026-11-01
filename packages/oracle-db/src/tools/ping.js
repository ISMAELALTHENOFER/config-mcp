import { withConnection, OUT_FORMAT_OBJECT } from '../utils/db.js';
import { permissionMode } from '../config/connections.js';

export async function handlePing({ connection } = {}) {
  const { result, config } = await withConnection(connection, async (conn, config) => ({
    result: await conn.execute(
      'SELECT BANNER FROM V$VERSION WHERE ROWNUM = 1',
      {},
      { outFormat: OUT_FORMAT_OBJECT },
    ),
    config,
  }));

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            estado: 'conectado',
            conexion: config.name,
            version: result.rows[0]?.BANNER ?? 'desconocida',
            connectString: config.connectString,
            esquema: config.schema || config.user.toUpperCase(),
            permisos: permissionMode(config),
          },
          null,
          2,
        ),
      },
    ],
  };
}
