import { withConnection, OUT_FORMAT_OBJECT } from '../utils/db.js';
import { z } from 'zod';

export const querySchema = {
  sql: z.string().describe('Sentencia SQL SELECT a ejecutar'),
  binds: z.record(z.union([z.string(), z.number(), z.null()])).optional(),
  limit: z.number().int().min(1).max(1000).default(100),
};

export const queryInputSchema = z.object({
  sql: z.string().min(1),
  binds: z.record(z.union([z.string(), z.number(), z.null()])).default({}),
  limit: z.number().int().min(1).max(1000).default(100),
});

function isReadOnlySql(sql) {
  const normalizedSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\r\n]*/g, ' ')
    .trim()
    .replace(/;$/, '')
    .toUpperCase();

  if (!/^(SELECT|WITH)\b/.test(normalizedSql)) {
    return false;
  }

  return (
    !/\b(INSERT|UPDATE|DELETE|MERGE|ALTER|DROP|TRUNCATE|CREATE|GRANT|REVOKE)\b/.test(
      normalizedSql,
    ) &&
    !/\bFOR\s+UPDATE\b/.test(normalizedSql) &&
    !normalizedSql.includes(';')
  );
}

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

  const { sql, binds, limit } = parsed.data;
  const result = await withConnection((connection) =>
    connection.execute(sql, binds, { maxRows: limit, outFormat: OUT_FORMAT_OBJECT }),
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
