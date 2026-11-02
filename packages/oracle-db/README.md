# Oracle DB MCP Server

Servidor MCP para varias bases Oracle desde una sola instancia. Cada conexión tiene nombre propio y su propio nivel de permisos. Funciona con Claude Code, OpenCode y cualquier cliente MCP por stdio.

## Quick Start

```bash
npm ci
cp connections.example.json connections.json   # editar conexiones y permisos
npm start
```

`connections.json` no se versiona. Las credenciales no se escriben ahí: se referencian con `${VARIABLE}` y se toman del entorno que pasa el cliente MCP o del `.env` de la raíz del monorepo (el entorno del cliente tiene prioridad).

## Prerrequisitos

- Node.js 22+
- Acceso de red a cada base
- Usuarios Oracle con los privilegios mínimos de cada conexión

## Configuración de conexiones

```json
{
  "defaultConnection": "dev",
  "connections": {
    "dev": {
      "label": "Development",
      "user": "${ORACLE_USER}",
      "password": "${ORACLE_PASSWORD}",
      "connectString": "${ORACLE_CONNECT_STRING}",
      "schema": "",
      "permissions": ["select"]
    },
    "test": {
      "label": "Test",
      "user": "${ORACLE_TEST_USER}",
      "password": "${ORACLE_TEST_PASSWORD}",
      "connectString": "${ORACLE_TEST_CONNECT_STRING}",
      "permissions": ["select", "update"]
    }
  }
}
```

| Campo | Default | Descripción |
|---|---|---|
| `label` | el nombre | Descripción mostrada por `list_connections`. |
| `user`, `password`, `connectString` | — | Obligatorios. Admiten `${VARIABLE}`; si la variable no existe el servidor no arranca. |
| `schema` | usuario de la sesión | Esquema de trabajo (`ALTER SESSION SET CURRENT_SCHEMA`). Debe ser un identificador simple. |
| `permissions` | `["select"]` | Tipos de sentencia permitidos. Valores: `select`, `insert`, `update`, `delete`, `merge`, `ddl`. `select` siempre está incluido. Un valor desconocido impide arrancar el servidor. |

Ejemplos de `permissions`:

| Valor | Permite |
|---|---|
| `["select"]` | Solo lectura (`query`, `list_tables`, `describe_table`). |
| `["select", "update"]` | Lectura + `UPDATE` vía `execute`; `INSERT`, `DELETE`, `MERGE` y DDL se rechazan. |
| `["select", "insert", "update", "delete"]` | Lectura + DML sin `MERGE` ni DDL. |
| `["select", "insert", "update", "delete", "merge", "ddl"]` | Todo salvo PL/SQL. |

`MERGE` necesita su propio permiso `merge` aunque la conexión tenga `insert` y `update`. `ddl` agrupa `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `RENAME`, `COMMENT`, `GRANT` y `REVOKE`.

**Los bloques PL/SQL (`BEGIN`, `DECLARE`, `CALL`, `EXEC` y funciones inline `WITH FUNCTION`/`PROCEDURE`) nunca se ejecutan**, sin importar los permisos. El código PL/SQL se puede leer con `query` (por ejemplo, `SELECT TEXT FROM ALL_SOURCE WHERE NAME = 'MI_PKG' ORDER BY LINE`).

`defaultConnection` es la conexión usada cuando una tool no recibe `connection`; si se omite, es la primera definida. `ORACLE_MCP_CONFIG` permite apuntar a otro archivo.

**Modo compatible:** si `connections.json` no existe, el servidor levanta una única conexión `default` de solo lectura con `ORACLE_USER`, `ORACLE_PASSWORD` y `ORACLE_CONNECT_STRING`.

Después de editar `connections.json` hay que reiniciar el servidor MCP (o el cliente).

## Tools

Todas aceptan el parámetro opcional `connection` (salvo `list_connections`).

| Tool | Descripción |
|---|---|
| `list_connections` | Lista conexiones, esquema, permisos y cuál es la default. |
| `ping` | Verifica la conexión; devuelve versión, esquema y permisos. |
| `query` | `SELECT`/`WITH` de solo lectura con `binds` y `limit` (default 100, max 1000). Rechaza DML, DDL, `FOR UPDATE` y múltiples sentencias. |
| `execute` | Una sentencia `INSERT`/`UPDATE`/`DELETE`/`MERGE`/DDL, solo si su tipo figura en `permissions`, con commit automático. `dry_run: true` valida sin ejecutar. |
| `list_tables` | Tablas del esquema de la conexión, con filtro `LIKE` opcional (`filter`). |
| `describe_table` | Columnas de `table_name`; `schema` opcional (default: el de la conexión). |

Respuesta de `execute`: `{ "conexion": "test", "tipo_sentencia": "update", "filas_afectadas": 1 }`.

## Registro en clientes

Claude Code (`~/.claude.json`):

```json
"oracle-db": {
  "type": "stdio",
  "command": "node",
  "args": ["<ruta-absoluta>/packages/oracle-db/src/server.js"],
  "env": { "ORACLE_USER": "...", "ORACLE_PASSWORD": "...", "ORACLE_CONNECT_STRING": "..." }
}
```

OpenCode (`~/.config/opencode/opencode.json`):

```json
"oracle-db": {
  "type": "local",
  "command": ["node", "<ruta-absoluta>/packages/oracle-db/src/server.js"],
  "enabled": true,
  "environment": { "ORACLE_USER": "...", "ORACLE_PASSWORD": "...", "ORACLE_CONNECT_STRING": "..." }
}
```

Para agentes que deben ser de solo lectura, deshabilitar `oracle-db_execute` en su configuración de tools.

## Seguridad

- Escritura cerrada por defecto; cada tipo de sentencia se habilita explícitamente por conexión.
- La clasificación de sentencias ignora comentarios y el contenido de literales e identificadores entre comillas, rechaza múltiples sentencias, literales sin cerrar y todo lo no reconocido.
- Limitación: una función invocada desde un `SELECT` puede tener efectos secundarios en la base (por ejemplo, con `PRAGMA AUTONOMOUS_TRANSACTION`). La protección real es usar en cada conexión un usuario Oracle con solo los privilegios necesarios.

## Scripts

| Script | Uso |
|---|---|
| `npm start` | Inicia el servidor. |
| `npm test` | Comprueba que no haya tests enfocados y ejecuta Jest. |
| `npm run lint` | ESLint sobre `src/`. |
| `npm run format:check` | Prettier sobre `src/`, `tests/` y `scripts/`. |
