# MCP GitLab Server

## Objetivo

Desarrollar un servidor MCP (Model Context Protocol) profesional en JavaScript que permita a modelos de IA interactuar con GitLab mediante herramientas especializadas de **solo lectura** para consulta y análisis de repositorios, merge requests, y pipelines CI/CD.

El MCP deberá:

* Consultar merge requests por URL, ID o IID.
* Obtener diffs, comentarios, aprobaciones y pipelines de un MR.
* Listar MRs de un proyecto con filtros por estado, labels y búsqueda textual.
* Obtener información detallada de proyectos.
* Listar ramas de un repositorio con búsqueda opcional.
* Obtener contenido de archivos del repositorio.
* Mantener la seguridad de credenciales y datos sensibles.

---

# Objetivos Funcionales

El MCP debe permitir consultas como:

```text
Mostrame el MR 42 del proyecto group/project.
```

```text
Qué archivos se modificaron en el merge request 42?
```

```text
Cómo va el pipeline del MR 42?
```

```text
El MR 42 está aprobado?
```

```text
Listame los MRs abiertos del proyecto group/project con label "bug".
```

```text
Decime información del proyecto group/subgroup/project.
```

```text
Buscá ramas que contengan "hotfix" en group/project.
```

```text
Leé el contenido de docker-compose.yml del proyecto group/project.
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
* Bottleneck (vía @config-mcp/mcp-core)
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
GitLab MCP Server
 │
 └── GitLab REST API
```

---

# Estructura del Proyecto

```text
config-mcp/
├── .env                          # Variables centralizadas (raíz del monorepo)
├── .env.example                  # Template de variables
│
└── packages/gitlab/
    ├── src/
    │   ├── server.js             # Entry point — registra tools y handlers MCP SDK
    │   ├── config/
    │   │   └── env.js            # Carga .env raíz y valida con Zod
    │   ├── gitlab/
    │   │   ├── gitlabClient.js   # Cliente HTTP con auth PRIVATE-TOKEN
    │   │   ├── gitlabMapper.js   # Transforma respuestas API a objetos planos
    │   │   └── gitlabService.js  # Lógica de negocio, orquesta llamadas + mappers
    │   ├── middleware/
    │   │   ├── rateLimit.js      # Bottleneck (vía @config-mcp/mcp-core)
    │   │   └── validation.js     # Validación con Zod
    │   ├── schemas/
    │   │   └── toolSchemas.js    # Schemas y registro central de tools
    │   ├── tools/
    │   │   ├── getMr.js
    │   │   ├── getMrDiffs.js
    │   │   ├── getMrComments.js
    │   │   ├── getMrApprovals.js
    │   │   ├── getMrPipelines.js
    │   │   ├── listProjectMrs.js
    │   │   ├── getProject.js
    │   │   ├── listBranches.js
    │   │   └── getFileContent.js
    │   └── utils/
    │       ├── logger.js         # Winston logger
    │       ├── errors.js         # Clases de error personalizadas
    │       └── urlParser.js      # Parseo de URLs de GitLab
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
* PRIVATE-TOKEN
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
# GitLab
GITLAB_BASE_URL=https://gitlab.tsgroup.com.ar
GITLAB_PERSONAL_ACCESS_TOKEN=glpat-xxxxxxxxxxxxxxxx

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

# Integración GitLab

## Autenticación

```http
PRIVATE-TOKEN: glpat-xxxxxxxxxxxxxxxx
```

Base URL:

```text
https://gitlab.example.com
```

Endpoints:

```http
GET /api/v4/projects/{projectId}/merge_requests/{mrIid}

GET /api/v4/projects/{projectId}/merge_requests/{mrIid}/diffs

GET /api/v4/projects/{projectId}/merge_requests/{mrIid}/notes

GET /api/v4/projects/{projectId}/merge_requests/{mrIid}/approvals

GET /api/v4/projects/{projectId}/merge_requests/{mrIid}/pipelines

GET /api/v4/projects/{projectId}/merge_requests

GET /api/v4/projects/{projectPath}

GET /api/v4/projects/{projectId}/repository/branches

GET /api/v4/projects/{projectId}/repository/files/{filePath}
```

---

# Herramientas MCP

## get_mr

Obtiene información detallada de un merge request. Acepta identificación por URL completa, o por combinación de project ID + MR IID.

Entrada:

```json
{
  "url": "https://gitlab.example.com/group/project/-/merge_requests/42",
  "projectId": "group/project",
  "mrIid": 42
}
```

---

## get_mr_diffs

Obtiene los cambios de archivos (diff) de un merge request.

Entrada:

```json
{
  "projectId": "group/project",
  "mrIid": 42
}
```

---

## get_mr_comments

Obtiene las discusiones y comentarios de un merge request.

Entrada:

```json
{
  "projectId": "group/project",
  "mrIid": 42
}
```

---

## get_mr_approvals

Obtiene el estado de aprobación de un merge request.

Entrada:

```json
{
  "projectId": "group/project",
  "mrIid": 42
}
```

---

## get_mr_pipelines

Obtiene los pipelines CI/CD asociados a un merge request.

Entrada:

```json
{
  "projectId": "group/project",
  "mrIid": 42
}
```

---

## list_project_mrs

Lista los merge requests de un proyecto con filtros opcionales.

Entrada:

```json
{
  "projectId": "group/project",
  "state": "opened",
  "labels": "bug,frontend",
  "search": "fix login"
}
```

---

## get_project

Obtiene información detallada de un proyecto GitLab.

Entrada:

```json
{
  "projectPath": "group/project"
}
```

---

## list_branches

Lista las ramas de un repositorio con búsqueda opcional.

Entrada:

```json
{
  "projectId": "group/project",
  "search": "feature"
}
```

---

## get_file_content

Obtiene el contenido de un archivo del repositorio.

Entrada:

```json
{
  "projectId": "group/project",
  "filePath": "src/index.js",
  "ref": "main"
}
```

---

# Validaciones

Utilizar Zod para validar:

* projectId / projectPath
* mrIid (número entero positivo)
* URL de GitLab
* filePath (con protección contra path traversal)
* Nombres de rama
* Estado de MR (opened, closed, merged, all)
* Labels
* Ref (rama, tag o commit SHA)

---

# Rate Limiting

Implementar Bottleneck (vía @config-mcp/mcp-core).

Configuración:

```javascript
{
  minTime: 100,
  maxConcurrent: 10
}
```

---

# Logging

Registrar:

* Tool ejecutada
* Tiempo de respuesta
* Resultado
* Error (sin exponer tokens)

Formato:

```json
{
  "tool": "get_mr",
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
* Headers PRIVATE-TOKEN o Authorization
* Cookies
* Datos internos de infraestructura

## Manejo de Errores

Devolver mensajes claros:

```json
{
  "success": false,
  "message": "Merge request no encontrado"
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
14. Integración GitLab REST API.
15. Herramientas de merge requests.
16. Herramientas de repositorio.
17. Consulta de contenido de archivos.
18. Consulta de pipelines CI/CD.
