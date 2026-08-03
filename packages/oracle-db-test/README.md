# Servidor MCP Oracle DB de pruebas

Servidor MCP para conectarse a la base de datos Oracle de pruebas mediante
OpenCode, Claude Desktop, Cursor o Windsurf.

## Inicio rápido

Desde este directorio:

```bash
npm install
npm start
```

Las credenciales se cargan desde el `.env` raíz del monorepo. El archivo `.env`
está excluido de Git y nunca debe copiarse al README ni a la configuración
compartida.

El servidor es **exclusivamente de solo lectura**. No permite `INSERT`,
`UPDATE`, `DELETE` ni sentencias DDL.

## Requisitos

- Node.js 22 o superior.
- Oracle Instant Client instalado.
- Usuario Oracle con permisos de lectura.

## Herramientas

| Herramienta | Descripción |
|---|---|
| `ping` | Verifica la conexión y devuelve la versión del servidor. |
| `query` | Ejecuta consultas `SELECT` o `WITH` con parámetros bind. |
| `list_tables` | Lista las tablas accesibles del esquema actual. |
| `describe_table` | Devuelve columnas, tipos, nulabilidad y valores por defecto. |

### `query`

Acepta `sql`, `binds` opcionales y un `limit` entre 1 y 1000 filas. Solo admite
consultas `SELECT` o `WITH` sin operaciones DML, DDL ni `FOR UPDATE`.

### `list_tables`

Acepta un filtro opcional por nombre de tabla, por ejemplo `SOLIC%`.

### `describe_table`

Acepta `table_name` y un `schema` opcional para consultar la estructura de una
tabla.

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `ORACLE_TEST_USER` | Usuario de Oracle. | Sí |
| `ORACLE_TEST_PASSWORD` | Contraseña del usuario Oracle. | Sí |
| `ORACLE_TEST_CONNECT_STRING` | Cadena `host:puerto/servicio`. | Sí |
| `MCP_LOG_LEVEL` | `error`, `warn`, `info` o `debug`. | No |

## Configuración en OpenCode

Las credenciales se cargan desde el `.env` raíz del monorepo y no se incluyen
en `opencode.json`.

```json
{
  "mcp": {
    "oracle-db-test": {
      "type": "local",
      "command": [
        "node",
        "D:\\DESARROLLOS\\config-mcp\\packages\\oracle-db-test\\src\\server.js"
      ],
      "enabled": true,
      "environment": {}
    }
  }
}
```

## Desarrollo

Desde este directorio:

```bash
npm install
npm start
npm run dev
npm test
npm run lint
npm run format:check
```

## Arquitectura

```text
src/
├── server.js                    # Entry point y dispatcher MCP
├── config/env.js                # Carga y validación de variables
├── schemas/toolSchemas.js       # Schemas públicos de las tools
├── tools/                       # Handlers de ping, query y metadatos
└── utils/                       # Pool Oracle, logging y errores
```

El flujo de cada llamada es: OpenCode invoca una tool MCP, el dispatcher
resuelve el handler, el handler obtiene una conexión del pool, ejecuta la
consulta y libera la conexión en `finally`.

## Ejemplos de uso

```text
Verifica la conexión a Oracle de pruebas
Listame las tablas del esquema actual
Describime la tabla EMPLEADOS
Ejecuta SELECT * FROM EMPLEADOS WHERE ACTIVO = :activo con activo=1
```

## Tecnologías

Node.js 22+, MCP SDK, `oracledb`, Zod, Winston y Jest.

## Seguridad

- Usar credenciales con privilegios mínimos y solo lectura.
- Preferir variables de entorno o un gestor de secretos para contraseñas.
- Usar parámetros bind para valores dinámicos.
- Mantener el límite máximo de 1000 filas por consulta.
- No registrar contraseñas ni tokens en logs.
