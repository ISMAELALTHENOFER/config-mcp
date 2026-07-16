# MCP Jira + Tempo Server

## Objetivo

Desarrollar un servidor MCP (Model Context Protocol) profesional en JavaScript que permita a modelos de IA interactuar con Jira y Tempo mediante herramientas especializadas para consulta, análisis y seguimiento de trabajo.

El MCP deberá:

* Consultar Jira mediante JQL.
* Obtener información de proyectos.
* Obtener información de épicas.
* Obtener historias de usuario.
* Obtener tareas y subtareas.
* Consultar sprints.
* Consultar boards.
* Consultar releases.
* Obtener worklogs desde Tempo.
* Obtener métricas de productividad.
* Generar reportes ejecutivos.
* Mantener la seguridad de credenciales y datos sensibles.

---

# Objetivos Funcionales

El MCP debe permitir consultas como:

```text
Mostrar mis tareas abiertas.
```

```text
Mostrar las tareas asignadas a Juan Pérez.
```

```text
Buscar bugs críticos del proyecto RENTAX.
```

```text
Mostrar avance de la épica RENTAX-100.
```

```text
Mostrar horas cargadas en Tempo este mes.
```

```text
Mostrar tareas del sprint actual.
```

```text
Mostrar tareas bloqueadas.
```

```text
Mostrar métricas del proyecto.
```

---

# Stack Tecnológico

## Backend

* Node.js 22+
* JavaScript ES Modules
* MCP SDK
* Axios
* Zod
* dotenv
* Winston
* Bottleneck
* Jest

---

# Arquitectura

```text
LLM
 │
 ▼
MCP Client
 │
 ▼
Jira Tempo MCP Server
 │
 ├── Jira REST API
 │
 └── Tempo REST API
```

---

# Estructura del Proyecto

```text
config-mcp/
├── .env                          # Variables centralizadas (raíz del monorepo)
├── .env.example                  # Template de variables
│
└── packages/jira-tempo/
    ├── src/
    │   ├── server.js             # Entry point — registra tools y handlers MCP SDK
    │   ├── config/
    │   │   └── env.js            # Carga .env raíz y valida con Zod
    │   ├── jira/
    │   │   ├── jiraClient.js     # Cliente HTTP con Basic Auth
    │   │   ├── jiraQueries.js    # Builders de JQL y fields
    │   │   ├── jiraService.js    # Lógica de negocio — Jira
    │   │   └── jiraMapper.js     # Transforma respuestas Jira
    │   ├── tempo/
    │   │   ├── tempoClient.js    # Cliente HTTP para Tempo API
    │   │   ├── tempoService.js   # Lógica de negocio — Tempo
    │   │   └── tempoMapper.js    # Transforma respuestas Tempo
    │   ├── tools/
    │   │   ├── searchJql.js
    │   │   ├── getIssue.js
    │   │   ├── getIssueComments.js
    │   │   ├── getProject.js
    │   │   ├── getEpic.js
    │   │   ├── getEpicProgress.js
    │   │   ├── getSprint.js
    │   │   ├── getBoard.js
    │   │   ├── getRelease.js
    │   │   ├── getMyTasks.js
    │   │   ├── getBlockedIssues.js
    │   │   ├── getProjectMetrics.js
    │   │   ├── getTempoWorklogs.js
    │   │   ├── getTempoUserHours.js
    │   │   ├── getTempoProjectHours.js
    │   │   ├── getTempoTeamHours.js
    │   │   └── getTempoIssueHours.js
    │   ├── middleware/
    │   │   ├── rateLimit.js      # Bottleneck (vía @config-mcp/mcp-core)
    │   │   ├── security.js       # Sanitización de datos sensibles
    │   │   └── validation.js     # Validación con Zod
    │   ├── schemas/
    │   │   └── toolSchemas.js    # Schemas y registro central de tools
    │   └── utils/
    │       ├── logger.js         # Winston logger
    │       ├── errors.js         # Clases de error personalizadas
    │       └── sanitizers.js     # Funciones de sanitización
    ├── web/                      # Servidor web Express (opcional)
    ├── tests/
    ├── .env.example              # Referencia al .env raíz
    ├── package.json
    └── README.md
```

---

# Seguridad

## Regla Obligatoria

Nunca exponer:

* Tokens
* Passwords
* Variables de entorno
* API Keys
* Headers Authorization
* Cookies
* Información interna de infraestructura

Si el usuario solicita datos sensibles:

```text
Lo siento, la información sensible del sistema no está disponible.
```

---

# Variables de Entorno (centralizadas)

Todas las variables se definen en el archivo `.env` en la raíz del monorepo.
Cada servidor carga automáticamente desde `../../../../.env`.

```env
# Jira
JIRA_BASE_URL=https://cau-tsg.atlassian.net
JIRA_EMAIL=usuario@empresa.com
JIRA_API_TOKEN=xxxxxxxxxxxxxxxx

# Tempo
TEMPO_API_TOKEN=xxxxxxxxxxxxxxxx

# MCP (compartido)
MCP_PORT=3000
MCP_LOG_LEVEL=info
```

---

# Archivo .gitignore

```gitignore
node_modules/

.env
.env.*

!.env.example

dist/
coverage/

logs/
*.log

.vscode/
.idea/

.DS_Store
Thumbs.db
```

---

# Integración Jira

## Cliente Jira

Autenticación:

```http
Authorization: Basic base64(email:apiToken)
```

Base URL:

```text
https://empresa.atlassian.net
```

Endpoints:

```http
GET /rest/api/3/search/jql

GET /rest/api/3/issue/{issueKey}

GET /rest/agile/1.0/board

GET /rest/agile/1.0/sprint
```

---

# Integración Tempo

Base URL:

```text
https://api.tempo.io/4
```

Autenticación:

```http
Authorization: Bearer TEMPO_API_TOKEN
```

Endpoints:

```http
GET /worklogs

GET /worklogs/issue/{issueId}

GET /teams

GET /accounts
```

---

# Herramientas MCP

## search_jql

Ejecuta consultas JQL.

Entrada:

```json
{
  "jql": "project = RENTAX ORDER BY updated DESC",
  "maxResults": 50
}
```

---

## get_issue

Obtiene detalle completo de un issue.

Entrada:

```json
{
  "issueKey": "RENTAX-123"
}
```

---

## get_project

Obtiene información del proyecto.

Entrada:

```json
{
  "projectKey": "RENTAX"
}
```

---

## get_epic

Obtiene una épica y todas sus historias.

Entrada:

```json
{
  "epicKey": "RENTAX-100"
}
```

---

## get_sprint

Obtiene información de un sprint.

Entrada:

```json
{
  "sprintId": 52
}
```

---

## get_board

Obtiene información de un board.

Entrada:

```json
{
  "boardId": 12
}
```

---

## get_release

Obtiene información de una versión.

Entrada:

```json
{
  "projectKey": "RENTAX"
}
```

---

## get_my_tasks

JQL automático:

```sql
assignee = currentUser()
```

---

## get_blocked_issues

JQL automático:

```sql
status = Blocked
```

---

## get_project_metrics

Devuelve:

```json
{
  "open": 120,
  "inProgress": 45,
  "done": 300
}
```

---

## get_epic_progress

Combina Jira + Tempo.

Devuelve:

```json
{
  "epic": "RENTAX-100",
  "stories": 20,
  "completed": 15,
  "progress": 75,
  "hoursLogged": 320
}
```

---

# Herramientas Tempo

## get_tempo_worklogs

Entrada:

```json
{
  "issueKey": "RENTAX-123"
}
```

---

## get_tempo_user_hours

Entrada:

```json
{
  "accountId": "123456",
  "from": "2026-01-01",
  "to": "2026-01-31"
}
```

---

## get_tempo_project_hours

Entrada:

```json
{
  "projectKey": "RENTAX",
  "from": "2026-01-01",
  "to": "2026-01-31"
}
```

---

## get_tempo_team_hours

Entrada:

```json
{
  "teamId": 12
}
```

---

## get_tempo_issue_hours

Entrada:

```json
{
  "issueKey": "RENTAX-123"
}
```

---

# Validaciones

Utilizar Zod para validar:

* Issue Key
* Epic Key
* Project Key
* Sprint Id
* Board Id
* Team Id
* JQL
* Rangos de fecha

---

# Rate Limiting

Implementar Bottleneck.

Configuración:

```javascript
{
  minTime: 200,
  maxConcurrent: 5
}
```

---

# Logging

Registrar:

* Tool ejecutada
* Tiempo de respuesta
* Usuario
* Resultado
* Error

Formato:

```json
{
  "tool": "search_jql",
  "duration": 123,
  "success": true
}
```

---

# Reglas para el Agente

## Estilo de Respuesta

* Respuestas cortas.
* Sin emojis.
* Sin texto innecesario.
* Priorizar datos.
* Mostrar tablas cuando sea posible.

## Seguridad

Nunca responder:

* Tokens
* API Keys
* Variables .env
* Headers Authorization
* Cookies
* Datos internos de infraestructura

## Manejo de Errores

Devolver mensajes claros:

```json
{
  "success": false,
  "message": "Issue no encontrado"
}
```

---

# Compatibilidad

Compatible con:

* Claude Desktop
* Claude Code
* Cursor
* Windsurf
* OpenCode
* VSCode MCP
* ChatGPT MCP

---

# Entregables

1. Código fuente completo.
2. Configuración MCP.
3. Dockerfile.
4. docker-compose.yml.
5. README.
6. Tests unitarios.
7. Tests de integración.
8. ESLint.
9. Prettier.
10. GitHub Actions.
11. Ejemplos de uso.
12. Configuración segura mediante .env.
13. Exclusión automática de credenciales mediante .gitignore.
14. Integración Jira.
15. Integración Tempo.
16. Herramientas JQL avanzadas.
17. Métricas de proyectos.
18. Métricas de productividad.
19. Reportes de épicas.
20. Reportes de sprints.