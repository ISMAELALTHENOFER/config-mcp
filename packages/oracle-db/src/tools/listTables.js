import { withConnection, OUT_FORMAT_OBJECT } from '../utils/db.js';

export async function handleListTables({ filter, connection } = {}) {
  const result = await withConnection(connection, (conn, config) =>
    conn.execute(
      `SELECT TABLE_NAME, NUM_ROWS, LAST_ANALYZED
       FROM ALL_TABLES
       WHERE OWNER = NVL(:owner, USER)
         AND (:filter IS NULL OR TABLE_NAME LIKE :filter)
       ORDER BY TABLE_NAME`,
      { owner: config.schema || null, filter: filter ? filter.toUpperCase() : null },
      { outFormat: OUT_FORMAT_OBJECT },
    ),
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
