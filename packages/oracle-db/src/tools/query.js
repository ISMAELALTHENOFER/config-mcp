import { withConnection, OUT_FORMAT_OBJECT } from '../utils/db.js';
import { z } from 'zod';

export const querySchema = {
  sql: z.string().describe('Sentencia SQL SELECT a ejecutar'),
  binds: z
    .record(z.union([z.string(), z.number(), z.null()]))
    .optional()
    .describe('Parámetros de binding opcionales. Ej: { "id": 123, "nombre": "Juan" }'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(100)
    .describe('Máximo de filas a retornar (default 100, max 1000)'),
};

export async function handleQuery({ sql, binds = {}, limit }) {
  // Solo permitir SELECTs
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: solo se permiten sentencias SELECT o WITH en esta herramienta.',
        },
      ],
      isError: true,
    };
  }

  const result = await withConnection((conn) =>
    conn.execute(sql, binds, {
      maxRows: limit,
      outFormat: OUT_FORMAT_OBJECT,
    }),
  );

  const rows = result.rows ?? [];
  const meta = result.metaData?.map((c) => c.name) ?? [];

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            columnas: meta,
            total_filas: rows.length,
            filas: rows,
          },
          null,
          2,
        ),
      },
    ],
  };
}
