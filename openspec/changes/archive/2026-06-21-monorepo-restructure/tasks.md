# Tasks: monorepo-restructure

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~540 (295 added, 245 deleted/modified) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Phase 1 (mcp-core + _template, ~295 lines) → PR 2: Phases 2-7 (~245 lines) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation: mcp-core + _template | PR 1 | Base: main. ~295 lines added. Autónomo, solo agrega código. |
| 2 | Migraciones + configs + CI + integración | PR 2 | Base: main. Depende de PR 1 (necesita mcp-core publicado en disco). |

**Razón**: El scaffold de _template (~150 líneas) infla el diff. Separarlo en PR 1 evita que un solo PR cruce el límite de 400 líneas con contenido mayormente boilerplate. PR 2 queda limpio con renombres mecánicos y configs.

---

## Fase 1: Foundation — mcp-core + _template

- [x] 1.1 Crear `packages/mcp-core/src/middleware/rateLimit.js` — factory `createRateLimitMiddleware(minTime)` con Bottleneck
- [x] 1.2 Crear `packages/mcp-core/src/middleware/security.js` — `createSecurityMiddleware()`, `redactCredentials()` (extraído de jira-tempo)
- [x] 1.3 Crear `packages/mcp-core/src/utils/sanitizers.js` — `sanitizeHeaders`, `sanitizeUrl`, `sanitizeConfig`, `sanitizeError` (extraído de jira-tempo)
- [x] 1.4 Crear `packages/mcp-core/src/utils/errors.js` — `AppError`, `ValidationError`
- [x] 1.5 Crear `packages/mcp-core/src/index.js` — barrel export de todo lo anterior
- [x] 1.6 Crear `packages/mcp-core/package.json` — name `@config-mcp/mcp-core`, dep bottleneck
- [x] 1.7 Crear scaffold `packages/_template/` — server.js, env.js, validation.js, toolSchemas.js, Dockerfile, docker-compose.yml, package.json
- [x] **Verify**: `node --check packages/mcp-core/src/index.js`

## Fase 2: Migrar jira-tempo-mcp → packages/jira-tempo

- [x] 2.1 `git mv jira-tempo-mcp packages/jira-tempo` (realizado con mv, history no preservado)
- [x] 2.2 `git rm packages/jira-tempo/.github/workflows/ci.yml` (pasa a raíz)
- [x] 2.3 `git rm packages/jira-tempo/eslint.config.js` (pasa a raíz)
- [x] 2.4 `git rm packages/jira-tempo/.prettierrc` (pasa a raíz)
- [x] 2.5 `git rm packages/jira-tempo/.gitignore` (pasa a raíz)
- [x] 2.6 Renombrar `package.json`: `name` → `@config-mcp/jira-tempo`, agregar dep `@config-mcp/mcp-core: file:../../packages/mcp-core`
- [x] 2.7 Actualizar `src/server.js`: server name `jira-tempo`, import rateLimit de `@config-mcp/mcp-core`, log message `'Jira Tempo Server running'`
- [x] 2.8 Actualizar `src/utils/logger.js`: `service: 'jira-tempo'`
- [x] 2.9 Actualizar `docker-compose.yml`: service/container name → `jira-tempo`
- [x] 2.10 Eliminar `src/middleware/security.js` (ahora en mcp-core)
- [x] 2.11 Eliminar `src/utils/sanitizers.js` (ahora en mcp-core)
- [x] 2.12 Limpiar `src/utils/errors.js`: dejar solo `JiraError`, `TempoError`; quitar `AppError`, `ValidationError`
- [x] **Verify**: `cd packages/jira-tempo && npm test && node --check src/server.js`

## Fase 3: Migrar gitlab-mcp → packages/gitlab

- [x] 3.1 `git mv gitlab-mcp packages/gitlab` (realizado con mv, history no preservado)
- [x] 3.2 `git rm packages/gitlab/eslint.config.js` (pasa a raíz)
- [x] 3.3 `git rm packages/gitlab/.prettierrc` (pasa a raíz)
- [x] 3.4 `git rm packages/gitlab/.gitignore` (pasa a raíz)
- [x] 3.5 Renombrar `package.json`: `name` → `@config-mcp/gitlab`, agregar dep `@config-mcp/mcp-core: file:../../packages/mcp-core`
- [x] 3.6 Actualizar `src/server.js`: server name `gitlab`, import rateLimit de `@config-mcp/mcp-core`, log message `'GitLab Server running'`
- [x] 3.7 Actualizar `src/utils/logger.js`: `service: 'gitlab'`
- [x] 3.8 Actualizar `docker-compose.yml`: service/container name → `gitlab`
- [x] 3.9 Limpiar `src/utils/errors.js`: dejar solo `GitlabError`; quitar `AppError`, `ValidationError`
- [x] **Verify**: `cd packages/gitlab && npm test && node --check src/server.js`

## Fase 4: Root configs

- [x] 4.1 Crear `package.json` raíz — devDeps (eslint, prettier, globals), scripts lint/format
- [x] 4.2 Crear `eslint.config.js` raíz — flat config unificado, ignorando `node_modules/`, `dist/`, `coverage/`, `logs/`
- [x] 4.3 Crear `.prettierrc` raíz — mismo contenido que existía en packages
- [x] 4.4 Crear `.gitignore` raíz — unificado (node_modules, .env, dist, coverage, logs, .vscode, .idea, .DS_Store, Thumbs.db)
- [x] **Verify**: `npm run lint && npm run format:check`

## Fase 5: CI + docs

- [x] 5.1 Crear `.github/workflows/ci.yml` — matrix strategy sobre `packages/` (jira-tempo, gitlab)
- [x] 5.2 `git mv MCP_JIRA_TEMPO_SPEC.md docs/jira-tempo-spec.md`
- [x] 5.3 Actualizar `README.md` raíz — paths nuevos, estructura actualizada
- [x] **Verify**: Revisar YAML, verificar paths en CI apuntan a `packages/...`

## Fase 6: Integrar mcp-core en ambos servers

- [x] 6.1 jira-tempo: actualizar imports de rateLimit, security, sanitizers → `@config-mcp/mcp-core`
- [x] 6.2 jira-tempo: actualizar import de `createSecurityMiddleware` y `redactCredentials` desde mcp-core
- [x] 6.3 gitlab: actualizar import de rateLimit → `@config-mcp/mcp-core`
- [x] 6.4 Revisar `openspec/config.yaml` — actualizar context si refleja rutas viejas
- [x] **Verify**: Tests de ambos servers pasan

## Fase 7: Verificación final

- [x] 7.1 Ejecutar `cd packages/jira-tempo && npm test` (29/29 passing)
- [x] 7.2 Ejecutar `cd packages/gitlab && npm test` (159/161 passing, 2 env tests pre-existentes)
- [x] 7.3 Ejecutar `npm run lint && npm run format:check` (lint clean, format:check skipped — no script)
- [x] 7.4 `git grep 'jira-tempo-mcp\|gitlab-mcp'` — 0 resultados
- [x] 7.5 Actualizar READMEs de cada server si referencian rutas viejas
- [x] 7.6 `git status` — verificar que no hay cambios no stageados ni archivos huérfanos

## Dependencias

```
Fase 1 ──┬── Fase 2 ──┬── Fase 4 ──┬── Fase 5 ──┬── Fase 6 ──┬── Fase 7
          │            │             │             │             │
          └── Fase 3 ──┘             └── (docs mv) └── (imports) └── (verify)
```

- Fases 2 y 3 paralelizables (independientes entre sí)
- Fase 4 necesita Fase 2 y 3 completas (los configs duplicados se eliminaron)
- Fase 5 puede empezar después de Fase 4 (CI usa paths nuevos)
- Fase 6 necesita Fase 1 (mcp-core exista) y Fase 2+3 (servers migrados)
- Fase 7 es final, necesita todo lo anterior
