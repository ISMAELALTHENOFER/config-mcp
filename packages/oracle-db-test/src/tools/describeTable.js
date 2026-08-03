import { withConnection, OUT_FORMAT_OBJECT } from '../utils/db.js';
import { z } from 'zod';

export const describeTableSchema = {
  table_name: z.string(),
  schema: z.string().optional(),
};

export async function handleDescribeTable({ table_name, schema }) {
  const tableName = table_name.toUpperCase().replace(/'/g, "''");
  const owner = schema ? `'${schema.toUpperCase().replace(/'/g, "''")}'` : 'USER';
  const sql = `
    SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION,
           DATA_SCALE, NULLABLE, DATA_DEFAULT, COLUMN_ID
    FROM ALL_TAB_COLUMNS
    WHERE TABLE_NAME = '${tableName}'
      AND OWNER = ${owner}
    ORDER BY COLUMN_ID
  `;

  const result = await withConnection((connection) =>
    connection.execute(sql, {}, { outFormat: OUT_FORMAT_OBJECT }),
  );

  if (result.rows.length === 0) {
    return {
      content: [{ type: 'text', text: `No se encontró la tabla "${table_name}".` }],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ tabla: tableName, columnas: result.rows }, null, 2),
      },
    ],
  };
}
