# Exploración: monorepo-restructure

## 1. Estado Actual

El repositorio `config-mcp` contiene dos servidores MCP independientes compartiendo estructura casi idéntica pero sin código compartido:

| Aspecto | `jira-tempo-mcp/` | `gitlab-mcp/` |
|---------|-------------------|---------------|
| **package.json name** | `jira-tempo-mcp` | `gitlab-mcp` |
| **Server name** | `jira-tempo-mcp` | `gitlab-mcp` |
| **Service label (logger)** | `jira-tempo-mcp` | `gitlab-mcp` |
| **Dependencias** | SDK, Axios, Bottleneck, Express, Winston, Zod, dotenv | SDK, Axios, Bottleneck, Winston, Zod, dotenv (sin Express) |
| **Web UI** | `web/` (Express dashboard) | ❌ No tiene |
| **CI** | `.github/workflows/ci.yml` | ❌ No tiene |
| **Tests** | 4 tests planos en `tests/` | 21 tests organizados en `tests/unit/` + fixtures |
| **Dockerfile** | `npm ci --only=production` | `npm ci --omit=dev` (equivalente) |

### Archivos únicos de cada servidor

**Solo jira-tempo-mcp:**
- `src/middleware/security.js` — sanitiza headers y raw responses en el request pipeline
- `src/utils/sanitizers.js` — funciones de redacción de credenciales
- `web/server.js` + `web/public/index.html` — dashboard Express
- `.github/workflows/ci.yml`
- `test_web.ps1`
- `src/jira/jiraQueries.js` — builder de JQL
- `src/tempo/tempoService.js`, `tempoClient.js`, `tempoMapper.js` — 3 archivos de dominio Tempo

**Solo gitlab-mcp:**
- `src/utils/urlParser.js` — parseo de URLs de GitLab MR
- `src/gitlab/gitlabClient.js` — incluye `getAll()` con paginación automática
- `jest.config.js` (configuración explícita)
- `tests/fixtures/` — 8 fixtures JSON
- `tests/unit/gitlab/`, `tests/unit/utils/`, `tests/unit/tools/`, `tests/unit/config/` — 12 tests unitarios

---

## 2. Archivos Afectados (lista completa)

### Renombres de directorio (package → sin sufijo `-mcp`)

| Actual | Nuevo |
|--------|-------|
| `jira-tempo-mcp/` | `packages/jira-tempo/` |
| `gitlab-mcp/` | `packages/gitlab/` |

### Archivos que cambian de ruta (fuera de packages)

| Actual | Nuevo |
|--------|-------|
| `MCP_JIRA_TEMPO_SPEC.md` | `docs/jira-tempo-spec.md` |
| `openspec/config.yaml` | Actualizar `context` y referencias `{server-dir}` |

### Archivos con contenido que cambia (renombres internos)

**package.json (ambos):**
- `name`: `"jira-tempo-mcp"` → `"@config-mcp/jira-tempo"`, `"gitlab-mcp"` → `"@config-mcp/gitlab"`
- Script `test`: las rutas a Jest son relativas, no cambian
- Podría agregar `"workspaces"` en root si se adopta npm workspaces

**src/server.js (ambos):**
- `name: 'jira-tempo-mcp'` → `name: 'jira-tempo'` (línea 54)
- `name: 'gitlab-mcp'` → `name: 'gitlab'` (línea 38)
- Mensaje `logger.info('Jira Tempo MCP Server running', ...)` → `'Jira Tempo Server running'`

**src/utils/logger.js (ambos):**
- `service: 'jira-tempo-mcp'` → `service: 'jira-tempo'` (línea 10)
- `service: 'gitlab-mcp'` → `service: 'gitlab'` (línea 10)

**README.md (root):**
- Paths `./jira-tempo-mcp/` → `./packages/jira-tempo/`
- Paths `./gitlab-mcp/` → `./packages/gitlab/`
- Ruta `./MCP_JIRA_TEMPO_SPEC.md` → `./docs/jira-tempo-spec.md`

**README.md (cada server):**
- Paths relativos si referencian archivos del otro server

**Dockerfile (ambos):**
- Las rutas `COPY` son relativas, no cambian si el build context es el package dir

**docker-compose.yml (cada server):**
- Service/container name: `jira-tempo-mcp` → `jira-tempo`/`gitlab-mcp` → `gitlab`

**.github/workflows/ci.yml:**
- Si se unifica, cambia estructura completamente. Si se actualiza in-place: `cd jira-tempo-mcp` → `cd packages/jira-tempo`
- Docker image tag: `jira-tempo-mcp` → `jira-tempo`
- Env vars en CI: sin cambios

**tests:**
- Todos los imports relativos: `'../../src/...'` → `'../../../packages/jira-tempo/src/...'` (si se mueven tests a root)
  O se quedan igual si tests se mueven con el source.

### Archivos que NO cambian (contenido idéntico)
- `eslint.config.js` — idéntico en ambos, puede ir a root
- `.prettierrc` — idéntico en ambos, puede ir a root
- `.gitignore` — idéntico en ambos, puede ir a root
- `.env.example` — cambia según server, se queda en cada package

---

## 3. Mapa Shared vs Unique

### Código 100% IDÉNTICO (candidato a `packages/mcp-core/`)

| Archivo | Observación |
|---------|-------------|
| `src/middleware/rateLimit.js` | **Casi idéntico**: solo difiere `minTime` (200 vs 100). El _pattern_ es idéntico. El valor lo decide cada server. |
| `src/middleware/security.js` | Solo existe en jira-tempo. Debería estar en core. |
| `src/utils/sanitizers.js` | Solo existe en jira-tempo. Debería estar en core. |
| `eslint.config.js` | 100% idéntico |
| `.prettierrc` | 100% idéntico |
| `.gitignore` | 100% idéntico |
| `Dockerfile` pattern | Mismo layout, solo cambia el CMD (redundante si se unifica) |
| `docker-compose.yml` pattern | Mismo layout, solo cambia service/container name |

### Código MISMO PATRÓN, contenido diferente (cada server mantiene el suyo)

| Archivo | jira-tempo | gitlab | Diferencia |
|---------|------------|--------|------------|
| `src/config/env.js` | `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `TEMPO_API_TOKEN` | `GITLAB_BASE_URL`, `GITLAB_PERSONAL_ACCESS_TOKEN` | Variables de entorno distintas. El patrón (dotenv + Zod) es idéntico. |
| `src/middleware/validation.js` | Schemas Zod para Jira (issueKey, projectKey, sprintId, boardId, etc.) | Validators para GitLab (projectPath, mrIid, url) | Completamente diferentes |
| `src/schemas/toolSchemas.js` | 17 tools MCP | 9 tools MCP | Solo comparten el patrón de exportación `ALL_TOOLS` |
| `src/server.js` | 17 tool handlers | 9 tool handlers | Mismo scaffold, diferentes imports y handler map |
| `src/utils/errors.js` | AppError + JiraError + TempoError + ValidationError | AppError + GitlabError + ValidationError | AppError y ValidationError son idénticos. Los domain errors son específicos. |

### Código ÚNICO de cada server (se queda en su package)

**jira-tempo:**
- `src/jira/` (jiraClient.js, jiraMapper.js, jiraQueries.js, jiraService.js) — 4 archivos
- `src/tempo/` (tempoClient.js, tempoMapper.js, tempoService.js) — 3 archivos
- `src/tools/` — 17 handlers
- `web/` — dashboard Express
- `tests/jiraMapper.test.js`, `tests/tempoMapper.test.js`, `tests/validation.test.js`, `tests/sanitizers.test.js`

**gitlab:**
- `src/gitlab/` (gitlabClient.js, gitlabMapper.js, gitlabService.js) — 3 archivos
- `src/utils/urlParser.js` — 1 archivo
- `src/tools/` — 9 handlers
- `tests/` — 21 archivos (incluyendo fixtures)

### Resumen cuantitativo

| Categoría | Archivos | Líneas aprox. |
|-----------|----------|--------------|
| **Compartible (core)** | rateLimit, security, sanitizers, eslint, prettier, gitignore, Dockerfile pattern | ~140 |
| **Mismo patrón** | env.js, errors.js, logger.js, server.js | ~200 |
| **Único jira-tempo** | jira/, tempo/, tools/, web/, tests | ~2000 |
| **Único gitlab** | gitlab/, urlParser, tools/, tests/ | ~1500 |

---

## 4. Evaluación de Template (`_template/`)

**Viable pero con limitaciones.** El patrón de server.js es altamente repetitivo:

```
server.js pattern:
  1. Import SDK, env, logger, ALL_TOOLS, rateLimit, tool handlers
  2. Define TOOL_HANDLERS map
  3. Create Server(name, version, capabilities)
  4. setRequestHandler(ListToolsRequestSchema)
  5. setRequestHandler(CallToolRequestSchema) con rate limit + error handling
  6. main() → connect + listen
```

Un `_template/` serviría como:
- Punto de partida para nuevos MCP servers
- Documentación viva de la arquitectura esperada
- Checklist de lo que cada server debe implementar

**Lo que NO se puede templatear:**
- `env.js` (variables de entorno específicas)
- `validation.js` (schemas de dominio)
- `toolSchemas.js` (tools específicas)
- Domain layer (client, mapper, service, queries)
- Tool handlers (lógica de negocio)

**Patrón emergente de tool handler:**
```js
// @param {object} args - parsed arguments
// @returns {{ content: Array<{type: string, text: string}> }}
```
Cada handler: (1) valida args con Zod, (2) llama service, (3) retorna `{ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }`.

---

## 5. Árbol de Directorios Recomendado

```
config-mcp/
├── packages/
│   ├── mcp-core/                    # ← NUEVO: código compartido
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   │   ├── rateLimit.js     # (minTime configurable vía parámetro)
│   │   │   │   └── security.js
│   │   │   └── utils/
│   │   │       ├── sanitizers.js
│   │   │       └── errors.js        # Solo AppError + ValidationError
│   │   └── package.json
│   │
│   ├── jira-tempo/                  # ← RENOMBRADO (era jira-tempo-mcp)
│   │   ├── src/
│   │   │   ├── config/env.js
│   │   │   ├── jira/                # client, mapper, queries, service
│   │   │   ├── tempo/               # client, mapper, service
│   │   │   ├── middleware/
│   │   │   │   └── validation.js
│   │   │   ├── schemas/
│   │   │   │   └── toolSchemas.js
│   │   │   ├── tools/               # 17 handlers
│   │   │   └── server.js
│   │   ├── web/                     # Express dashboard
│   │   │   ├── server.js
│   │   │   └── public/
│   │   │       └── index.html
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── .env.example
│   │   └── package.json             # name: "@config-mcp/jira-tempo"
│   │
│   ├── gitlab/                      # ← RENOMBRADO (era gitlab-mcp)
│   │   ├── src/
│   │   │   ├── config/env.js
│   │   │   ├── gitlab/              # client, mapper, service
│   │   │   ├── utils/
│   │   │   │   └── urlParser.js
│   │   │   ├── middleware/
│   │   │   │   └── validation.js
│   │   │   ├── schemas/
│   │   │   │   └── toolSchemas.js
│   │   │   ├── tools/               # 9 handlers
│   │   │   └── server.js
│   │   ├── tests/
│   │   │   ├── fixtures/
│   │   │   └── unit/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── .env.example
│   │   └── package.json             # name: "@config-mcp/gitlab"
│   │
│   └── _template/                   # ← NUEVO: scaffold para futuros servers
│       ├── src/
│       │   ├── config/env.js
│       │   ├── middleware/validation.js
│       │   ├── schemas/toolSchemas.js
│       │   └── server.js
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── package.json
│
├── docs/                            # ← NUEVO
│   └── jira-tempo-spec.md           # ← RENOMBRADO (era MCP_JIRA_TEMPO_SPEC.md)
│
├── .github/
│   └── workflows/
│       └── ci.yml                   # ← UNIFICADO (matrix sobre packages)
│
├── openspec/
│   ├── config.yaml                  # ← ACTUALIZAR context y referencias
│   ├── changes/
│   └── specs/
│
├── eslint.config.js                  # ← MOVIDO DE packages a root
├── .prettierrc                       # ← MOVIDO DE packages a root
├── .gitignore                        # ← MOVIDO DE packages a root (uno solo)
├── package.json                      # ← NUEVO (npm workspaces)
├── docker-compose.yml                # ← NUEVO (root, orquesta todos)
└── README.md                         # ← ACTUALIZAR paths y descripción
```

---

## 6. Riesgos y Gotchas

### Riesgos Técnicos

1. **npm workspaces: inconsistentes con config.yaml actual.** El openspec/config.yaml dice explícitamente `(no npm workspaces)`. Si se adoptan, hay que decidir si cada server se despliega independiente (workspaces solo para dev) o si se comparte `node_modules` también en producción. Impacta Dockerfiles.

2. **`mcp-core` como package interno vs copia directa.** Workspaces permiten `"@config-mcp/mcp-core": "file:./packages/mcp-core"` en cada server. Sin workspaces, tocaría copiar o usar symlinks. **Decisión fundacional.**

3. **Express está en jira-tempo pero no en gitlab.** Si se unifica eslint/prettier a root, no hay problema. Pero si se globalizan dependencias vía workspaces, Express se instalaría también para gitlab (innecesario). Solución: mantener `dependencies` por server.

4. **Tests de gitlab asumen paths relativos `../../src/...`.** Al mover a `packages/gitlab/tests/`, los paths siguen siendo `../../src/...` → siguen funcionando. **No hay riesgo de import paths si el árbol interno se preserva.**

5. **Dockerfiles con workspaces.** Si se usan workspaces, el `COPY package*.json ./` en cada Dockerfile no funciona porque `package.json` está en root. Habría que copiar root + packages específicos, o mantener builds independientes (sin workspaces en producción).

6. **CI unificada.** Actualmente jira-tempo tiene CI, gitlab no. Una CI unificada con matrix:
   ```yaml
   strategy:
     matrix:
       package: [jira-tempo, gitlab]
   ```
   Funciona bien para lint/test, pero para Docker build puede requerir context paths distintos.

### Gotchas de Renombrado

1. **Server `name` vs `service` vs package `name`.** Son 3 campos distintos que deben coincidir para debugging:
   - `package.json` → `name: "@config-mcp/jira-tempo"`
   - `server.js` → `name: 'jira-tempo'`
   - `logger.js` → `service: 'jira-tempo'`

2. **CI env vars específicas de jira-tempo.** Las env vars `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `TEMPO_API_TOKEN` están hardcodeadas en el CI. No aplicarían para gitlab. En una CI unificada, usar env vars por package matrix.

3. **`test_web.ps1`** es un script PowerShell único de jira-tempo. Debe moverse con el package.

4. **`.atl/skill-registry.md`** no referencia rutas de servidores, no necesita cambios.

5. **`openspec/specs/`** tiene directorios vacíos (`gitlab-file-read/`, `gitlab-mr-read/`). No afectan.

6. **`jest.config.js`** solo existe en gitlab-mcp. jira-tempo usa defaults. Si se unifica test runner a root, revisar compatibilidad.

### Edge Cases Detectados

- **rateLimit.js `minTime` difiere** (200 vs 100). Al mover a `mcp-core`, hacerlo configurable vía parámetro o mantenerlo por server.
- **gitlabClient.js tiene `getRaw()` y `getAll()`** que no están en jiraClient ni tempoClient. Es funcionalidad extra de ese dominio, no algo que se pueda shared.
- **security.js** solo existe en jira-tempo pero no tiene nada específico de Jira. Es pura sanitización genérica → candidato firme a `mcp-core`.
- **errors.js** tiene `AppError`+`ValidationError` idénticos y domain errors específicos. La opción más limpia es llevar solo `AppError`+`ValidationError` a core, mantener domain errors en cada server.

---

## 7. Conclusión y Ready for Proposal

**Ready for Proposal: Sí**

La exploración confirma que la reestructuración es viable y que el rename list de la pre-exploración es correcto. Los hallazgos adicionales son:

1. **`mcp-core` es viable** para rateLimit, security, sanitizers, AppError, ValidationError, eslint/prettier/gitignore compartidos.
2. **Los `minTime` de rateLimit difieren** → deben hacerse configurables (ej: variable de entorno `MCP_RATE_LIMIT_MS`).
3. **Workspaces o no workspaces** es la decisión arquitectónica más impactante.
4. **El `_template/` es viable** pero su valor principal es documentación, no código reutilizable.
5. **La CI unificada** con matrix strategy es el approach correcto.
6. **El web dashboard** es exclusivo de jira-tempo, no hay indicios de que gitlab lo necesite.

La recomendación es proceder con el proposal manteniendo la estructura de packages independientes (sin workspaces en producción) para no cambiar el deployment model actual, pero adoptando npm workspaces en desarrollo para `mcp-core`.
