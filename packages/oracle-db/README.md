# Oracle DB MCP Server

MCP server de solo lectura para bases de datos Oracle. Disenado para integrarse con asistentes AI (OpenCode, Claude Desktop, Cursor, Windsurf) y permitir ejecutar consultas SELECT, listar tablas e inspeccionar esquemas directamente desde el editor.

## Quick Start

```bash
npm install
cp ../../.env.example .env
# Editar .env con credenciales de Oracle
npm start
```

## Prerrequisitos

- Node.js 22+ (ESM nativo)
- Cliente Oracle Instant Client instalado en el sistema
- Acceso a una base de datos Oracle con credenciales de lectura

## Tools

Todas las tools son **solo lectura** -- ejecutan unicamente consultas SELECT sobre la base de datos.

| Tool | Descripcion |
|---|---|
| `ping` | Verifica que la conexion a Oracle este activa y retorna la version del servidor |
| `query` | Ejecuta una consulta SELECT en la base de datos Oracle y retorna los resultados |
| `list_tables` | Lista todas las tablas accesibles en el esquema actual de Oracle |
| `describe_table` | Retorna la estructura de una tabla Oracle: columnas, tipos de dato, longitud, si acepta NULL y valor por defecto |

### Referencia detallada

#### `ping`

Verifica conectividad con la base de datos y retorna informacion del servidor.

**Parametros:** Ninguno.

**Ejemplo:**
```
Verifica la conexion a Oracle
La base de datos Oracle esta funcionando?
```

#### `query`

Ejecuta una consulta SELECT arbitraria con soporte para bind parameters y limite de filas.

**Parametros:**

| Parametro | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `sql` | `string` | Si | Sentencia SQL SELECT a ejecutar |
| `binds` | `object` | No | Parametros de binding opcionales. Ej: `{ "id": 123, "nombre": "Juan" }` |
| `limit` | `number` | No | Maximo de filas a retornar (default 100, max 1000) |

**Ejemplo:**
```
Ejecuta SELECT * FROM usuarios WHERE id = :id con bind id=42
Listame las primeras 50 filas de la tabla empleados
Busca proyectos cuyo nombre contenga "infra" en la tabla proyectos
```

#### `list_tables`

Lista las tablas accesibles en el esquema actual, con filtro opcional por nombre.

**Parametros:**

| Parametro | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `filter` | `string` | No | Filtro opcional por nombre de tabla (busca con LIKE, ej: `SOLIC%`) |

**Ejemplo:**
```
Listame las tablas del esquema actual
Que tablas empiezan con SOLIC?
Mostrame las tablas que contengan "PROY" en el nombre
```

#### `describe_table`

Retorna la estructura completa de una tabla: columnas, tipos de datos, longitud, nulabilidad y valores por defecto.

**Parametros:**

| Parametro | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `table_name` | `string` | Si | Nombre de la tabla a describir (sin esquema) |
| `schema` | `string` | No | Esquema propietario de la tabla. Si se omite, se usa el usuario actual. |

**Ejemplo:**
```
Describime la tabla usuarios
Cual es la estructura de la tabla empleados?
Mostrame las columnas de la tabla proyectos del esquema RRHH
```

## Variables de entorno

| Variable | Descripcion | Requerida |
|---|---|---|
| `ORACLE_USER` | Usuario de la base de datos Oracle | Si |
| `ORACLE_PASSWORD` | Contrasena del usuario Oracle | Si |
| `ORACLE_CONNECT_STRING` | Cadena de conexion Oracle (ej: `host:puerto/SID` o `host:puerto/servicio`) | Si |
| `MCP_LOG_LEVEL` | Nivel de log: `error`, `warn`, `info`, `debug` (default: `info`) | No |

## Configuracion por cliente

### OpenCode

```json
{
  "mcp": {
    "oracle-db": {
      "command": ["node", "ruta/completa/config-mcp/packages/oracle-db/src/server.js"],
      "enabled": true,
      "type": "local"
    }
  }
}
```

> Las variables de entorno se cargan desde el .env raiz del monorepo. No es necesario incluirlas en la configuracion de OpenCode.

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "oracle-db": {
      "command": "node",
      "args": ["ruta/completa/config-mcp/packages/oracle-db/src/server.js"]
    }
  }
}
```

> Las variables de entorno se cargan desde el .env raiz del monorepo. No es necesario incluirlas en la configuracion de Claude Desktop.

### Cursor

```json
{
  "mcpServers": {
    "oracle-db": {
      "command": "node",
      "args": ["ruta/completa/config-mcp/packages/oracle-db/src/server.js"]
    }
  }
}
```

> Las variables de entorno se cargan desde el .env raiz del monorepo. No es necesario incluirlas en la configuracion de Cursor.

### Windsurf

```json
{
  "mcpServers": {
    "oracle-db": {
      "command": "node",
      "args": ["ruta/completa/config-mcp/packages/oracle-db/src/server.js"]
    }
  }
}
```

> Las variables de entorno se cargan desde el .env raiz del monorepo. No es necesario incluirlas en la configuracion de Windsurf.

## Arquitectura

```
src/
├── server.js                    # Entry point -- registra tools y handlers
├── config/
│   └── env.js                   # Carga y validacion de variables de entorno con Zod
├── middleware/                   # Directorio preparado para middleware futuro
├── schemas/
│   └── toolSchemas.js           # Schemas y registro central de tools
├── tools/
│   ├── ping.js                  # Handler de ping
│   ├── query.js                 # Handler de consultas SELECT
│   ├── listTables.js            # Handler de listado de tablas
│   └── describeTable.js         # Handler de descripcion de tablas
└── utils/
    ├── db.js                    # Pool de conexiones Oracle (poolMin: 1, poolMax: 5)
    ├── logger.js                # Winston logger
    └── errors.js                # Clases de error personalizadas
```

**Flujo de una llamada:**

1. El cliente AI envia `CallToolRequest` con nombre de tool + argumentos
2. `server.js` resuelve el handler en `TOOL_HANDLERS`
3. El handler ejecuta la logica correspondiente usando `withConnection` del pool
4. `utils/db.js` obtiene una conexion del pool Oracle y la libera al finalizar
5. El resultado se devuelve como texto JSON con formato `{ success, data }` o `{ success, message }` en caso de error

## Ejemplos de uso

```
Verifica la conexion a Oracle
Listame las tablas del esquema actual
Describime la tabla empleados
Ejecuta SELECT * FROM usuarios WHERE activo = 1
Cuantas filas tiene la tabla proyectos?
Mostrame la estructura de la tabla solicitudes del esquema RRHH
Busca tablas que empiecen con "TMP_"
Listame las primeras 10 filas de la tabla departamentos
```

## Desarrollo

```bash
npm run dev           # Auto-reload con --watch
npm test              # Tests con Jest
npm run lint          # ESLint
npm run lint:fix      # ESLint con auto-fix
npm run format        # Prettier
npm run format:check  # Verificacion de formato
```

## Seguridad

- Conexion exclusivamente de solo lectura -- no se ejecutan INSERT, UPDATE, DELETE ni DDL
- Credenciales solo via `.env` (excluido de git)
- Pool de conexiones con limites configurables (poolMin: 1, poolMax: 5)
- Validacion de entrada con Zod antes de cualquier consulta
- Bind parameters obligatorios para valores dinamicos en consultas
- Limite maximo de filas retornadas (1000) para evitar abusos
- Las conexiones se cierran siempre en el bloque `finally` de `withConnection`

## Tech Stack

Node.js 22+ . ES Modules . MCP SDK . oracledb . Zod . Winston . Jest . ESLint . Prettier
