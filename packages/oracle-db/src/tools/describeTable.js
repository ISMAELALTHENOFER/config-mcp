import { withConnection, OUT_FORMAT_OBJECT } from '../utils/db.js';

export async function handleDescribeTable({ table_name, schema, connection } = {}) {
  const result = await withConnection(connection, (conn, config) =>
    conn.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE,
              NULLABLE, DATA_DEFAULT, COLUMN_ID
       FROM ALL_TAB_COLUMNS
       WHERE TABLE_NAME = :tableName
         AND OWNER = NVL(:owner, USER)
       ORDER BY COLUMN_ID`,
      {
        tableName: String(table_name ?? '').toUpperCase(),
        owner: schema ? schema.toUpperCase() : config.schema || null,
      },
      { outFormat: OUT_FORMAT_OBJECT },
    ),
  );

  if (result.rows.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No se encontró la tabla "${table_name}"${schema ? ` en el esquema "${schema}"` : ''}.`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          { tabla: String(table_name).toUpperCase(), columnas: result.rows },
          null,
          2,
        ),
      },
    ],
  };
}
