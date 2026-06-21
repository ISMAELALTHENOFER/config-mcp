# Jira Tempo MCP Server

MCP server que expone herramientas de solo lectura para Jira y Tempo. Diseñado para integrarse con asistentes AI (Claude, OpenCode, Cursor, Windsurf) y permitir consultas sobre issues, proyectos, epics, sprints, tableros, releases y horas de Tempo sin salir del editor.

## Quick Start

```bash
npm install
cp .env.example .env
# Editar .env con credenciales
npm start
```

## Tools

Todas las tools son **solo lectura** — consultan datos sin modificar nada en Jira o Tempo.

| Tool | Descripción |
|---|---|
| `search_jql` | Ejecuta consultas JQL libres |
| `get_issue` | Detalle completo de un issue (descripción, subtareas, padre, épica) |
| `get_issue_comments` | Todos los comentarios de un issue |
| `get_project` | Información del proyecto |
| `get_epic` | Épica con todas sus historias |
| `get_epic_progress` | Progreso de épica (stories completadas + horas) |
| `get_sprint` | Información del sprint |
| `get_board` | Información del tablero |
| `get_release` | Versiones/releases del proyecto |
| `get_my_tasks` | Tareas asignadas al usuario actual |
| `get_blocked_issues` | Issues bloqueados |
| `get_project_metrics` | Métricas del proyecto (open, in progress, done) |
| `get_tempo_worklogs` | Worklogs de un issue |
| `get_tempo_user_hours` | Horas por usuario en rango de fechas |
| `get_tempo_project_hours` | Horas por proyecto en rango de fechas |
| `get_tempo_team_hours` | Horas por equipo |
| `get_tempo_issue_hours` | Total de horas de un issue |

## Configuración por cliente

### OpenCode

```json
{
  "mcp": {
    "jira-tempo": {
      "command": ["node", "D:\\ruta\\completa\\jira-tempo-mcp\\src\\server.js"],
      "enabled": true,
      "type": "local",
      "env": {
        "JIRA_BASE_URL": "https://tu-dominio.atlassian.net",
        "JIRA_EMAIL": "tu-email@example.com",
        "JIRA_API_TOKEN": "tu-token",
        "TEMPO_API_TOKEN": "tu-tempo-token"
      }
    }
  }
}
```

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "jira-tempo": {
      "command": "node",
      "args": ["ruta/completa/jira-tempo-mcp/src/server.js"],
      "env": {
        "JIRA_BASE_URL": "https://tu-dominio.atlassian.net",
        "JIRA_EMAIL": "tu-email@example.com",
        "JIRA_API_TOKEN": "tu-token",
        "TEMPO_API_TOKEN": "tu-tempo-token"
      }
    }
  }
}
```

### Cursor

```json
{
  "mcpServers": {
    "jira-tempo": {
      "command": "node",
      "args": ["ruta/completa/jira-tempo-mcp/src/server.js"],
      "env": {
        "JIRA_BASE_URL": "https://tu-dominio.atlassian.net",
        "JIRA_EMAIL": "tu-email@example.com",
        "JIRA_API_TOKEN": "tu-token",
        "TEMPO_API_TOKEN": "tu-tempo-token"
      }
    }
  }
}
```

### Windsurf

```json
{
  "mcpServers": {
    "jira-tempo": {
      "command": "node",
      "args": ["ruta/completa/jira-tempo-mcp/src/server.js"],
      "env": {
        "JIRA_BASE_URL": "https://tu-dominio.atlassian.net",
        "JIRA_EMAIL": "tu-email@example.com",
        "JIRA_API_TOKEN": "tu-token",
        "TEMPO_API_TOKEN": "tu-tempo-token"
      }
    }
  }
}
```

## Arquitectura

```
src/
├── server.js                 # Entry point — registra tools y handlers
├── config/
│   └── env.js                # Carga y validación de variables de entorno
├── jira/
│   ├── jiraClient.js         # Cliente HTTP con autenticación Basic Auth
│   ├── jiraQueries.js        # Fiels y builders de JQL
│   ├── jiraService.js        # Lógica de negocio — orquesta llamadas y mappers
│   └── jiraMapper.js         # Transforma respuestas de la API a objetos planos
├── tempo/
│   ├── tempoClient.js        # Cliente HTTP para Tempo API
│   ├── tempoService.js       # Lógica de negocio para Tempo
│   └── tempoMapper.js        # Transforma respuestas de Tempo
├── tools/
│   ├── searchJql.js
│   ├── getIssue.js
│   ├── getIssueComments.js   # Tool agregada manualmente
│   ├── getProject.js
│   ├── getEpic.js
│   ├── getSprint.js
│   ├── getBoard.js
│   ├── getRelease.js
│   ├── getMyTasks.js
│   ├── getBlockedIssues.js
│   ├── getProjectMetrics.js
│   ├── getEpicProgress.js
│   └── ... (tempo)
├── middleware/
│   ├── rateLimit.js          # Bottleneck — evita exceder rate limits de Jira
│   ├── security.js           # Sanitización de datos sensibles en logs
│   └── validation.js         # Zod schemas para validación de inputs
├── schemas/
│   └── toolSchemas.js        # Schemas y registro central de tools
└── utils/
    ├── logger.js             # Winston logger
    ├── errors.js             # Clases de error personalizadas
    └── sanitizers.js         # Funciones de sanitización
```

**Flujo de una llamada:**

1. El cliente AI envía `CallToolRequest` con nombre de tool + argumentos
2. `server.js` resuelve el handler en `TOOL_HANDLERS`
3. `rateLimit` controla cuota antes de pasar al handler
4. `validation` valida los argumentos con Zod
5. El handler llama al `jiraService` o `tempoService` correspondiente
6. El service hace `GET` a la API vía `jiraClient` / `tempoClient`
7. La respuesta cruda pasa por el mapper y se devuelve como texto JSON

## Ejemplos de uso

```
Buscá los issues bloqueados del proyecto REM
Mostrame el progreso de la épica RENTAX-100
Cuántas horas tiene el issue REM-12934?
Qué tareas tengo asignadas?
Mostrame los comentarios de REM-12934
Buscá bugs críticos en el proyecto SCF
```

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `JIRA_BASE_URL` | URL de la instancia Jira | Sí |
| `JIRA_EMAIL` | Email de la cuenta Jira | Sí |
| `JIRA_API_TOKEN` | API token de Jira | Sí |
| `TEMPO_API_TOKEN` | API token de Tempo | Sí |
| `MCP_PORT` | Puerto del servidor web (default: 3000) | No |
| `MCP_LOG_LEVEL` | Nivel de log: error / warn / info / debug | No |

## Desarrollo

```bash
npm run dev        # Auto-reload con --watch
npm test           # Tests con Jest
npm run test:coverage
npm run lint       # ESLint
npm run format     # Prettier
```

## Docker

```bash
docker compose up -d
```

## Seguridad

- Autenticación Basic Auth con token de Jira
- Credenciales solo vía `.env` (excluido de git)
- Tokens redactados automáticamente en logs
- Rate limiting para no exceder cuotas de API
- Validación de entrada con Zod antes de cualquier llamada externa

## Tech Stack

Node.js 22+ · ES Modules · MCP SDK · Axios · Zod · Bottleneck · Winston · Jest · ESLint · Prettier · Docker
