import { withConnection, OUT_FORMAT_OBJECT } from '../utils/db.js';
import { isReadOnlySql } from '../utils/sql.js';
import { z } from 'zod';

export const queryInputSchema = z.object({
  sql: z.string().min(1),
  binds: z.record(z.union([z.string(), z.number(), z.null()])).default({}),
  limit: z.number().int().min(1).max(1000).default(100),
  connection: z.string().optional(),
});

export async function handleQuery(args = {}) {
  const parsed = queryInputSchema.safeParse(args);
  if (!parsed.success || !isReadOnlySql(parsed.data?.sql ?? '')) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: solo se permiten consultas SELECT o WITH de solo lectura.',
        },
      ],
      isError: true,
    };
  }

  const { sql, binds, limit, connection } = parsed.data;
  const result = await withConnection(connection, (conn) =>
    conn.execute(sql, binds, { maxRows: limit, outFormat: OUT_FORMAT_OBJECT }),
  );

  const rows = result.rows ?? [];
  const columns = result.metaData?.map((column) => column.name) ?? [];
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          { columnas: columns, total_filas: rows.length, filas: rows },
          null,
          2,
        ),
      },
    ],
  };
}
