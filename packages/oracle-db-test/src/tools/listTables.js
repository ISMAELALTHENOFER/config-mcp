import { withConnection, OUT_FORMAT_OBJECT } from '../utils/db.js';
import { z } from 'zod';

export const listTablesSchema = {
  filter: z.string().optional(),
};

export async function handleListTables({ filter } = {}) {
  const safeFilter = filter?.toUpperCase().replace(/'/g, "''");
  const whereClause = safeFilter ? `AND TABLE_NAME LIKE '${safeFilter}'` : '';
  const sql = `
    SELECT TABLE_NAME, NUM_ROWS, LAST_ANALYZED
    FROM USER_TABLES
    WHERE 1=1 ${whereClause}
    ORDER BY TABLE_NAME
  `;

  const result = await withConnection((connection) =>
    connection.execute(sql, {}, { outFormat: OUT_FORMAT_OBJECT }),
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ total: result.rows.length, tablas: result.rows }, null, 2),
      },
    ],
  };
}
