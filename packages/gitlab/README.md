# GitLab MCP Server

MCP server que expone herramientas de **solo lectura** para GitLab. Diseñado para integrarse con asistentes AI (OpenCode, Claude Desktop, Cursor, Windsurf) y permitir consultar merge requests, proyectos, ramas, archivos y pipelines sin salir del editor.

## Quick Start

```bash
npm install
cp .env.example .env
# Editar .env con credenciales de GitLab
npm start
```

## Prerrequisitos

- Node.js 22+ (ESM nativo)
- Token de acceso personal de GitLab con alcance `read_api`

## Tools

Todas las tools son **solo lectura** — consultan datos sin modificar nada en GitLab.

### Merge Requests

| Tool | Descripción |
|---|---|
| `get_mr` | Obtener detalles de un merge request por URL, project ID o MR IID |
| `get_mr_diffs` | Obtener cambios/diffs de un merge request |
| `get_mr_comments` | Obtener comentarios/discusiones de un merge request |
| `get_mr_approvals` | Obtener estado de aprobación de un merge request |
| `get_mr_pipelines` | Obtener pipelines CI/CD de un merge request |
| `list_project_mrs` | Listar merge requests de un proyecto con filtros opcionales |

### Proyectos y Repositorio

| Tool | Descripción |
|---|---|
| `get_project` | Obtener detalles de un proyecto por su path |
| `list_branches` | Listar ramas de un repositorio con búsqueda opcional |
| `get_file_content` | Obtener contenido de un archivo del repositorio |

### Referencia detallada

#### `get_mr`

Obtiene información detallada de un merge request. Acepta identificación por URL completa, o por combinación de project ID + MR IID.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `url` | `string` | No | URL completa del MR (ej: `https://gitlab.example.com/group/project/-/merge_requests/42`) |
| `projectId` | `string` | No | ID del proyecto o path encoded (ej: `"group/project"` o `"42"`) |
| `mrIid` | `number` | No | IID del merge request |

**Ejemplo:**
```
Mostrame el MR 42 del proyecto group/project
Obtene los detalles del merge request https://gitlab.example.com/group/project/-/merge_requests/42
```

#### `get_mr_diffs`

Obtiene los cambios de archivos (diff) de un merge request.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `projectId` | `string` | Sí | ID del proyecto o path encoded |
| `mrIid` | `number` | Sí | IID del merge request |

**Ejemplo:**
```
Mostrame los cambios del MR 42
Qué archivos se modificaron en el merge request 42?
```

#### `get_mr_comments`

Obtiene las discusiones y comentarios de un merge request.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `projectId` | `string` | Sí | ID del proyecto o path encoded |
| `mrIid` | `number` | Sí | IID del merge request |

**Ejemplo:**
```
Mostrame los comentarios del MR 42
Qué dijo el revisor en el merge request 42?
```

#### `get_mr_approvals`

Obtiene el estado de aprobación de un merge request (quiénes aprobaron, cuántas aprobaciones necesita).

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `projectId` | `string` | Sí | ID del proyecto o path encoded |
| `mrIid` | `number` | Sí | IID del merge request |

**Ejemplo:**
```
El MR 42 está aprobado?
Quiénes aprobaron el merge request 42?
```

#### `get_mr_pipelines`

Obtiene los pipelines CI/CD asociados a un merge request.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `projectId` | `string` | Sí | ID del proyecto o path encoded |
| `mrIid` | `number` | Sí | IID del merge request |

**Ejemplo:**
```
Cómo va el pipeline del MR 42?
Mostrame los pipelines del merge request 42
```

#### `list_project_mrs`

Lista los merge requests de un proyecto con filtros opcionales por estado, labels y búsqueda textual.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `projectId` | `string` | Sí | ID del proyecto o path encoded |
| `state` | `string` | No | Filtrar por estado: `opened`, `closed`, `merged`, `all` |
| `labels` | `string` | No | Lista de labels separadas por coma para filtrar |
| `search` | `string` | No | Texto de búsqueda en título o descripción del MR |

**Ejemplo:**
```
Listame los MRs abiertos del proyecto group/project
Buscá MRs con label "bug" en el proyecto group/project
Mostrame los MRs merged de la última semana
```

#### `get_project`

Obtiene información detallada de un proyecto GitLab por su path.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `projectPath` | `string` | Sí | Path del proyecto (ej: `"group/project"` o `"group/subgroup/project"`) |

**Ejemplo:**
```
Decime información del proyecto group/project
Mostrame los detalles del repositorio group/subgroup/project
```

#### `list_branches`

Lista las ramas de un repositorio con búsqueda opcional por nombre.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `projectId` | `string` | Sí | ID del proyecto o path encoded |
| `search` | `string` | No | Patrón de búsqueda para nombres de rama |

**Ejemplo:**
```
Listame las ramas del proyecto group/project
Buscá ramas que contengan "feature" en group/project
```

#### `get_file_content`

Obtiene el contenido de un archivo del repositorio en una rama, tag o commit específico.

**Parámetros:**

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `projectId` | `string` | Sí | ID del proyecto o path encoded |
| `filePath` | `string` | Sí | Ruta al archivo dentro del repositorio |
| `ref` | `string` | No | Rama, tag o commit SHA (default: rama por defecto) |

**Ejemplo:**
```
Mostrame el contenido de src/index.js del proyecto group/project
Leé el archivo docker-compose.yml en la rama develop
Obtene README.md del proyecto group/subgroup/project
```

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `GITLAB_BASE_URL` | URL base de la instancia GitLab (ej: `https://gitlab.tsgroup.com.ar`) | Sí |
| `GITLAB_PERSONAL_ACCESS_TOKEN` | Token de acceso personal con alcance `read_api` | Sí |
| `MCP_PORT` | Puerto del servidor (default: 3000) | No |
| `MCP_LOG_LEVEL` | Nivel de log: `error`, `warn`, `info`, `debug` (default: `info`) | No |

## Configuración por cliente

### OpenCode

```json
{
  "mcp": {
    "gitlab": {
      "command": ["node", "D:\\ruta\\completa\\gitlab-mcp\\src\\server.js"],
      "enabled": true,
      "type": "local",
      "env": {
        "GITLAB_BASE_URL": "https://gitlab.tsgroup.com.ar",
        "GITLAB_PERSONAL_ACCESS_TOKEN": "tu-token-personal"
      }
    }
  }
}
```

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": ["ruta/completa/gitlab-mcp/src/server.js"],
      "env": {
        "GITLAB_BASE_URL": "https://gitlab.tsgroup.com.ar",
        "GITLAB_PERSONAL_ACCESS_TOKEN": "tu-token-personal"
      }
    }
  }
}
```

### Cursor

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": ["ruta/completa/gitlab-mcp/src/server.js"],
      "env": {
        "GITLAB_BASE_URL": "https://gitlab.tsgroup.com.ar",
        "GITLAB_PERSONAL_ACCESS_TOKEN": "tu-token-personal"
      }
    }
  }
}
```

### Windsurf

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": ["ruta/completa/gitlab-mcp/src/server.js"],
      "env": {
        "GITLAB_BASE_URL": "https://gitlab.tsgroup.com.ar",
        "GITLAB_PERSONAL_ACCESS_TOKEN": "tu-token-personal"
      }
    }
  }
}
```

## Arquitectura

```
src/
├── server.js                    # Entry point — registra tools y handlers
├── config/
│   └── env.js                   # Carga y validación de variables de entorno con Zod
├── gitlab/
│   ├── gitlabClient.js          # Cliente HTTP con autenticación PRIVATE-TOKEN
│   ├── gitlabMapper.js          # Transforma respuestas de la API a objetos planos
│   └── gitlabService.js         # Lógica de negocio — orquesta llamadas y mappers
├── middleware/
│   ├── rateLimit.js             # Bottleneck — evita exceder rate limits de GitLab
│   └── validation.js            # Zod schemas para validación de inputs
├── schemas/
│   └── toolSchemas.js           # Schemas y registro central de tools
├── tools/
│   ├── getMr.js
│   ├── getMrDiffs.js
│   ├── getMrComments.js
│   ├── getMrApprovals.js
│   ├── getMrPipelines.js
│   ├── listProjectMrs.js
│   ├── getProject.js
│   ├── listBranches.js
│   └── getFileContent.js
└── utils/
    ├── logger.js                # Winston logger
    ├── errors.js                # Clases de error personalizadas
    └── urlParser.js             # Parseo de URLs de GitLab
```

**Flujo de una llamada:**

1. El cliente AI envía `CallToolRequest` con nombre de tool + argumentos
2. `server.js` resuelve el handler en `TOOL_HANDLERS`
3. `rateLimit` controla cuota antes de pasar al handler
4. `validation` valida los argumentos con Zod
5. El handler llama al `gitlabService` correspondiente
6. El service hace `GET` a la API vía `gitlabClient`
7. La respuesta cruda pasa por el mapper y se devuelve como texto JSON

## Ejemplos de uso

```
Mostrame el MR 42 del proyecto group/project
Qué archivos se modificaron en el merge request 42?
Cómo va el pipeline del MR 42?
El MR 42 está aprobado?
Listame los MRs abiertos del proyecto group/project con label "bug"
Decime información del proyecto group/subgroup/project
Buscá ramas que contengan "hotfix" en group/project
Leé el contenido de docker-compose.yml del proyecto group/project
```

## Desarrollo

```bash
npm run dev           # Auto-reload con --watch
npm test              # Tests con Jest
npm run test:coverage # Cobertura (threshold: 90%)
npm run lint          # ESLint
npm run format        # Prettier
```

## Docker

```bash
docker compose up -d
```

## Seguridad

- Autenticación con Personal Access Token vía header `PRIVATE-TOKEN`
- Credenciales solo vía `.env` (excluido de git)
- Tokens redactados automáticamente en logs
- Rate limiting para no exceder cuotas de la API de GitLab
- Validación de entrada con Zod antes de cualquier llamada externa
- Protección contra path traversal en `get_file_content`

## Tech Stack

Node.js 22+ · ES Modules · MCP SDK · Axios · Zod · Bottleneck · Winston · Jest · ESLint · Prettier · Docker
