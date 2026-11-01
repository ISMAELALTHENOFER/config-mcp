import { z } from 'zod';
import { withConnection } from '../utils/db.js';
import { getConnectionConfig } from '../config/connections.js';
import { classifySql, checkWritePermission } from '../utils/sql.js';

export const executeInputSchema = z.object({
  sql: z.string().min(1),
  binds: z.record(z.union([z.string(), z.number(), z.null()])).default({}),
  connection: z.string().optional(),
  dry_run: z.boolean().default(false),
});

function errorResult(text) {
  return { content: [{ type: 'text', text: `Error: ${text}` }], isError: true };
}

export async function handleExecute(args = {}) {
  const parsed = executeInputSchema.safeParse(args);
  if (!parsed.success) {
    return errorResult('parámetros inválidos: se requiere "sql".');
  }

  const { sql, binds, connection, dry_run } = parsed.data;
  const config = getConnectionConfig(connection);
  const kind = classifySql(sql);
  const rejection = checkWritePermission(config, kind);
  if (rejection) {
    return errorResult(rejection);
  }

  if (dry_run) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              conexion: config.name,
              tipo_sentencia: kind,
              dry_run: true,
              permitido: true,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  const result = await withConnection(config.name, (conn) =>
    conn.execute(sql, binds, { autoCommit: true }),
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            conexion: config.name,
            tipo_sentencia: kind,
            filas_afectadas: result.rowsAffected ?? 0,
          },
          null,
          2,
        ),
      },
    ],
  };
}
