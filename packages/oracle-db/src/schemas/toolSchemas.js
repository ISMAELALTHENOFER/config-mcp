import {
  CONNECTIONS,
  DEFAULT_CONNECTION,
  permissionMode,
} from '../config/connections.js';

const connectionNames = Object.values(CONNECTIONS)
  .map((config) => `${config.name} (${permissionMode(config)})`)
  .join(', ');

const connection = {
  type: 'string',
  enum: Object.keys(CONNECTIONS),
  description: `Conexión a usar: ${connectionNames}. Si se omite, se usa "${DEFAULT_CONNECTION}".`,
};

const binds = {
  type: 'object',
  description: 'Parámetros de binding opcionales. Ej: { "id": 123, "nombre": "Juan" }',
  additionalProperties: { type: ['string', 'number', 'null'] },
};

export const ALL_TOOLS = [
  {
    name: 'list_connections',
    description: 'Lista las conexiones Oracle configuradas con su esquema y permisos',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'ping',
    description:
      'Verifica que la conexión a Oracle esté activa y retorna la versión del servidor',
    inputSchema: { type: 'object', properties: { connection }, required: [] },
  },
  {
    name: 'query',
    description:
      'Ejecuta una consulta SELECT en la base de datos Oracle y retorna los resultados',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'Sentencia SQL SELECT a ejecutar' },
        binds,
        limit: {
          type: 'number',
          description: 'Máximo de filas a retornar (default 100, max 1000)',
          default: 100,
        },
        connection,
      },
      required: ['sql'],
    },
  },
  {
    name: 'execute',
    description:
      'Ejecuta INSERT/UPDATE/DELETE/MERGE (conexiones con write) o DDL (conexiones con allowDdl), con commit automático. Nunca ejecuta bloques PL/SQL.',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'Una única sentencia DML o DDL' },
        binds,
        connection,
        dry_run: {
          type: 'boolean',
          description: 'Valida tipo de sentencia y permisos sin ejecutar',
          default: false,
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'list_tables',
    description: 'Lista las tablas del esquema de trabajo de la conexión',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description:
            "Filtro opcional por nombre de tabla (busca con LIKE, ej: 'SOLIC%')",
        },
        connection,
      },
      required: [],
    },
  },
  {
    name: 'describe_table',
    description:
      'Retorna la estructura de una tabla Oracle: columnas, tipos de dato, longitud, si acepta NULL y valor por defecto',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Nombre de la tabla a describir (sin esquema)',
        },
        schema: {
          type: 'string',
          description:
            'Esquema propietario de la tabla. Si se omite, se usa el de la conexión.',
        },
        connection,
      },
      required: ['table_name'],
    },
  },
];
