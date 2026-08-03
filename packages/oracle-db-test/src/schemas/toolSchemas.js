export const ALL_TOOLS = [
  {
    name: 'ping',
    description:
      'Verifica que la conexión a Oracle esté activa y retorna la versión del servidor',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'query',
    description:
      'Ejecuta una consulta SELECT en la base de datos Oracle y retorna los resultados',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'Sentencia SQL SELECT a ejecutar' },
        binds: {
          type: 'object',
          description: 'Parámetros de binding opcionales',
          additionalProperties: { type: ['string', 'number', 'null'] },
        },
        limit: {
          type: 'number',
          description: 'Máximo de filas (default 100, max 1000)',
          default: 100,
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'list_tables',
    description: 'Lista todas las tablas accesibles en el esquema actual de Oracle',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: "Filtro opcional por nombre (ej: 'SOLIC%')",
        },
      },
      required: [],
    },
  },
  {
    name: 'describe_table',
    description: 'Retorna la estructura de una tabla Oracle',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: { type: 'string', description: 'Nombre de la tabla sin esquema' },
        schema: { type: 'string', description: 'Esquema propietario opcional' },
      },
      required: ['table_name'],
    },
  },
];
