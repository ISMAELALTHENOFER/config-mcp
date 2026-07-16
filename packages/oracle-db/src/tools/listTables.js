import { withConnection, OUT_FORMAT_OBJECT } from '../utils/db.js';
import { z } from 'zod';

export const listTablesSchema = {
  filter: z
    .string()
    .optional()
    .describe("Filtro opcional por nombre de tabla (busca con LIKE, ej: 'SOLIC%')"),
};

export async function handleListTables({ filter }) {
  const where = filter
    ? `AND TABLE_NAME LIKE '${filter.toUpperCase().replace(/'/g, "''")}'`
    : '';

  const sql = `
    SELECT TABLE_NAME, NUM_ROWS, LAST_ANALYZED
    FROM USER_TABLES
    WHERE 1=1 ${where}
    ORDER BY TABLE_NAME
  `;

  const result = await withConnection((conn) =>
    conn.execute(sql, {}, { outFormat: OUT_FORMAT_OBJECT }),
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            total: result.rows.length,
            tablas: result.rows,
          },
          null,
          2,
        ),
      },
    ],
  };
}
