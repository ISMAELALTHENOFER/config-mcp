# config-mcp

Monorepo de servidores [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) para consultar Jira, Tempo, GitLab y Oracle desde clientes compatibles. Los servidores se ejecutan como procesos Node.js independientes mediante transporte **stdio**; no exponen por sí mismos un endpoint HTTP MCP.

Todos los servidores son de solo lectura. Validan sus argumentos antes de consultar los sistemas externos y cargan las variables desde el `.env` ubicado en la raíz del repositorio.

> **Configuración rápida:** instalá el package que necesites, completá el `.env` y copiá la configuración MCP de tu cliente desde [Configuración MCP para el equipo](#configuración-mcp-para-el-equipo).

## Servidores y herramientas

### `jira-tempo`

Consulta Jira y Tempo. Requiere `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` y `TEMPO_API_TOKEN`.

| Herramienta | Función |
|---|---|
| `search_jql` | Ejecuta una consulta JQL. |
| `get_issue` | Obtiene el detalle de un issue. |
| `get_issue_comments` | Obtiene los comentarios de un issue. |
| `get_project` | Obtiene información de un proyecto. |
| `get_epic` | Obtiene una épica y sus historias. |
| `get_epic_progress` | Obtiene el progreso de una épica, incluidas historias completadas y horas registradas. |
| `get_sprint` | Obtiene información de un sprint. |
| `get_board` | Obtiene información de un tablero. |
| `get_release` | Obtiene las versiones de un proyecto. |
| `get_my_tasks` | Obtiene las tareas asignadas al usuario actual. |
| `get_blocked_issues` | Lista issues bloqueados. |
| `get_project_metrics` | Obtiene conteos de issues abiertos, en progreso y terminados. |
| `get_tempo_worklogs` | Obtiene los worklogs de un issue. |
| `get_tempo_user_hours` | Obtiene horas de un usuario en un rango de fechas. |
| `get_tempo_project_hours` | Obtiene horas de un proyecto en un rango de fechas. |
| `get_tempo_team_hours` | Obtiene horas de un equipo. |
| `get_tempo_issue_hours` | Obtiene el total de horas de un issue. |

### `gitlab`

Consulta merge requests, proyectos y repositorios de GitLab. Requiere `GITLAB_BASE_URL` y `GITLAB_PERSONAL_ACCESS_TOKEN` con alcance `read_api`.

| Herramienta | Función |
|---|---|
| `get_mr` | Obtiene un merge request por URL, ID de proyecto o IID. |
| `get_mr_diffs` | Obtiene los cambios de un merge request. |
| `get_mr_comments` | Obtiene sus discusiones y comentarios. |
| `get_mr_approvals` | Obtiene su estado de aprobación. |
| `get_mr_pipelines` | Obtiene sus pipelines CI/CD. |
| `list_project_mrs` | Lista merge requests con filtros opcionales. |
| `get_project` | Obtiene los detalles de un proyecto. |
| `list_branches` | Lista ramas con búsqueda opcional. |
| `get_file_content` | Obtiene el contenido de un archivo en una rama, tag o commit. |

### `oracle-db`

Consulta una base de datos Oracle con permisos de lectura. Requiere `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING` y Oracle Instant Client.

| Herramienta | Función |
|---|---|
| `ping` | Verifica la conexión y devuelve la versión del servidor. |
| `query` | Ejecuta consultas `SELECT` o `WITH`, con bind parameters y límite de filas. |
| `list_tables` | Lista las tablas accesibles, con filtro opcional. |
| `describe_table` | Describe columnas, tipos, longitud, nulabilidad y valores por defecto. |

`query` devuelve como máximo 100 filas por defecto y admite hasta 1000. No permite DML, DDL ni `FOR UPDATE`.

### `oracle-db-test`

Tiene las mismas cuatro herramientas que `oracle-db`, pero usa las variables `ORACLE_TEST_USER`, `ORACLE_TEST_PASSWORD` y `ORACLE_TEST_CONNECT_STRING` para una base Oracle de pruebas.

### Paquetes auxiliares

- [`mcp-core`](./packages/mcp-core/): utilidades compartidas, incluido rate limiting y manejo de errores.
- [`_template`](./packages/_template/): plantilla privada para crear nuevos servidores MCP; no es un servidor desplegable del catálogo.

El package `jira-tempo` también incluye un dashboard web auxiliar (`npm run start:web`) que escucha en `WEB_PORT` o en el puerto `3001`. Este dashboard no es el transporte MCP.

## Requisitos

- Node.js 22 o superior.
- npm, incluido con Node.js.
- Credenciales y conectividad con el servicio que se quiera consultar.
- Oracle Instant Client para `oracle-db` y `oracle-db-test`.
- En Oracle, un usuario con permisos de solo lectura.

## Instalación reproducible

Desde la raíz del repositorio:

```bash
git clone <URL-del-repositorio>
cd config-mcp
```

Copiar `.env.example` como `.env`:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux**

```bash
cp .env.example .env
```

Editar `.env` con las credenciales necesarias. Después instalar exactamente las dependencias bloqueadas del servidor o servidores que se vayan a usar:

```bash
npm ci --prefix packages/jira-tempo
npm ci --prefix packages/gitlab
npm ci --prefix packages/oracle-db
npm ci --prefix packages/oracle-db-test
```

No es necesario ejecutar los cuatro comandos si solo se usará un servidor. El `package.json` raíz no declara workspaces; cada package mantiene su propio `package-lock.json`.

## Configuración de `.env`

Todas las variables se definen en el único archivo `.env` de la raíz. Cada servidor carga solo las variables que necesita y termina con error si falta una variable obligatoria o su formato es inválido.

| Variable | Servidor | Requerida | Valor |
|---|---|---:|---|
| `JIRA_BASE_URL` | `jira-tempo` | Sí | URL de Jira. |
| `JIRA_EMAIL` | `jira-tempo` | Sí | Email de la cuenta de Jira. |
| `JIRA_API_TOKEN` | `jira-tempo` | Sí | API token de Jira. |
| `TEMPO_API_TOKEN` | `jira-tempo` | Sí | API token de Tempo. |
| `GITLAB_BASE_URL` | `gitlab` | Sí | URL base de GitLab. |
| `GITLAB_PERSONAL_ACCESS_TOKEN` | `gitlab` | Sí | Token personal con alcance `read_api`. |
| `ORACLE_USER` | `oracle-db` | Sí | Usuario de Oracle. |
| `ORACLE_PASSWORD` | `oracle-db` | Sí | Contraseña de Oracle. |
| `ORACLE_CONNECT_STRING` | `oracle-db` | Sí | `host:puerto/servicio` o formato equivalente aceptado por Oracle. |
| `ORACLE_TEST_USER` | `oracle-db-test` | Sí | Usuario de Oracle de pruebas. |
| `ORACLE_TEST_PASSWORD` | `oracle-db-test` | Sí | Contraseña de Oracle de pruebas. |
| `ORACLE_TEST_CONNECT_STRING` | `oracle-db-test` | Sí | Cadena de conexión de Oracle de pruebas. |
| `MCP_LOG_LEVEL` | Todos | No | `error`, `warn`, `info` o `debug`; por defecto `info`. |
| `MCP_PORT` | `jira-tempo`, `gitlab` | No | Valor numérico usado en el mensaje de inicio; el transporte MCP sigue siendo stdio. Por defecto `3000`. |

El archivo `.env` contiene secretos y no debe incluirse en Git ni en configuraciones compartidas.

## Verificación local

Ejecutar las pruebas del servidor instalado:

```bash
npm test --prefix packages/jira-tempo
npm test --prefix packages/gitlab
npm test --prefix packages/oracle-db-test
```

`oracle-db` no tiene actualmente una suite de pruebas automatizadas; comprueba
la conexión con `ping` desde el cliente MCP.

Para validar el código JavaScript y el formato de cada package:

```bash
npm run lint --prefix packages/jira-tempo
npm run format:check --prefix packages/jira-tempo
npm run lint --prefix packages/gitlab
npm run format:check --prefix packages/gitlab
npm run lint --prefix packages/oracle-db
npm run format:check --prefix packages/oracle-db
npm run lint --prefix packages/oracle-db-test
npm run format:check --prefix packages/oracle-db-test
```

El package raíz solo contiene la configuración común de ESLint y Prettier; no
es necesario instalar dependencias adicionales allí para ejecutar los
servidores.

Para iniciar un servidor manualmente:

```bash
npm start --prefix packages/jira-tempo
```

Sustituir `jira-tempo` por `gitlab`, `oracle-db` u `oracle-db-test` según corresponda. Un servidor MCP por stdio queda ejecutándose y espera mensajes del cliente; no debe probarse abriendo `http://localhost:3000`. La herramienta `ping` de los servidores Oracle permite comprobar la conexión a la base de datos desde el cliente MCP.

## Configuración MCP para el equipo

Esta es la **fuente única de configuración MCP del repositorio**. No copies credenciales en los clientes ni mantengas configuraciones diferentes por servidor.

### Pasos obligatorios

1. Instalá Node.js 22 o superior.
2. Cloná el repositorio y ejecutá `npm ci --prefix packages/<servidor>` para cada servidor que vayas a usar.
3. Copiá `.env.example` como `.env` y completá únicamente las credenciales necesarias.
4. Sustituí `<ruta-absoluta>` en el bloque de tu cliente por la ruta real al repositorio.
5. Reiniciá el cliente y verificá que las herramientas MCP aparezcan disponibles.

Todos los entry points son archivos JavaScript ejecutados con Node y usan transporte **stdio**. En JSON para Windows se pueden usar `/` o escapar cada `\` como `\\`.

| Cliente | Sección o clave de configuración | Formato que usa este repositorio |
|---|---|---|
| OpenCode | `mcp` en `opencode.json` | `command` como array, `enabled` y `type: "local"` |
| Claude Code/Desktop | Configuración MCP del cliente | `mcpServers`, `command` y `args` |
| Cursor | Configuración MCP del cliente | `mcpServers`, `command` y `args` |
| Windsurf | Configuración MCP del cliente | `mcpServers`, `command` y `args` |

Los nombres de archivo y su ubicación pueden variar según la versión y el sistema operativo del cliente. Usá la pantalla de configuración MCP o el archivo que el cliente indique, pero conservá exactamente la estructura de abajo.

### OpenCode

En la sección `mcp` de `opencode.json`:

```json
{
  "mcp": {
    "jira-tempo": {
      "command": ["node", "<ruta-absoluta>/packages/jira-tempo/src/server.js"],
      "enabled": true,
      "type": "local"
    },
    "gitlab": {
      "command": ["node", "<ruta-absoluta>/packages/gitlab/src/server.js"],
      "enabled": true,
      "type": "local"
    },
    "oracle-db": {
      "command": ["node", "<ruta-absoluta>/packages/oracle-db/src/server.js"],
      "enabled": true,
      "type": "local"
    },
    "oracle-db-test": {
      "command": ["node", "<ruta-absoluta>/packages/oracle-db-test/src/server.js"],
      "enabled": true,
      "type": "local"
    }
  }
}
```

### Cursor, Claude Desktop/Code y Windsurf

Estos clientes usan el formato `mcpServers` documentado en los READMEs de los packages. Registrar únicamente los servidores que se necesiten:

```json
{
  "mcpServers": {
    "jira-tempo": {
      "command": "node",
      "args": ["<ruta-absoluta>/packages/jira-tempo/src/server.js"]
    },
    "gitlab": {
      "command": "node",
      "args": ["<ruta-absoluta>/packages/gitlab/src/server.js"]
    },
    "oracle-db": {
      "command": "node",
      "args": ["<ruta-absoluta>/packages/oracle-db/src/server.js"]
    },
    "oracle-db-test": {
      "command": "node",
      "args": ["<ruta-absoluta>/packages/oracle-db-test/src/server.js"]
    }
  }
}
```

Las credenciales no se duplican en estas configuraciones: los servidores cargan el `.env` de la raíz del repositorio. Para cualquier otra plataforma, usar este formato solo si documenta explícitamente compatibilidad con servidores MCP locales por stdio y con la clave `mcpServers`; el repositorio no declara integraciones adicionales.

## Scripts disponibles

Cada servidor mantiene estos scripts, salvo indicación contraria:

| Script | Uso |
|---|---|
| `npm start` | Inicia el servidor MCP. |
| `npm run dev` | Inicia el servidor con `node --watch`. |
| `npm test` | Ejecuta las pruebas Jest. En `oracle-db-test` también comprueba que no haya tests enfocados. |
| `npm run lint` | Ejecuta ESLint sobre `src/`. |
| `npm run format:check` | Comprueba el formato con Prettier. |
| `npm run format` | Formatea los archivos JavaScript. |

`jira-tempo` y `gitlab` también definen `npm run test:coverage`; `jira-tempo` define además `npm run start:web` y `npm run dev:web` para su dashboard auxiliar.

## Documentación relacionada

- [`packages/jira-tempo/README.md`](./packages/jira-tempo/README.md)
- [`packages/gitlab/README.md`](./packages/gitlab/README.md)
- [`packages/oracle-db/README.md`](./packages/oracle-db/README.md)
- [`packages/oracle-db-test/README.md`](./packages/oracle-db-test/README.md)
- [`docs/jira-tempo-spec.md`](./docs/jira-tempo-spec.md)
- [`docs/gitlab-spec.md`](./docs/gitlab-spec.md)

## Principios operativos

- **Solo lectura:** las herramientas consultan datos y no exponen operaciones de escritura.
- **Transporte stdio:** cada servidor se inicia como proceso local para el cliente MCP.
- **Validación:** los argumentos se validan antes de realizar llamadas externas o consultas.
- **Protección de secretos:** las credenciales se cargan desde `.env` y los logs redactan información sensible cuando corresponde.
- **Rate limiting:** Jira/Tempo y GitLab aplican control de cuota a las llamadas externas.
