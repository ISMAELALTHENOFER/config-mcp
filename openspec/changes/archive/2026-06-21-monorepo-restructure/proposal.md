# Propuesta: monorepo-restructure

## Intención

Reestructurar config-mcp de servidores MCP planos (`jira-tempo-mcp/`, `gitlab-mcp/`) a monorepo bajo `packages/`. Extraer código duplicado a `mcp-core`, unificar tooling raíz, y establecer una arquitectura escalable para nuevos servers MCP sin cambiar el modelo de despliegue independiente.

## Alcance

| Incluye | Excluye |
|---------|---------|
| Mover servers a `packages/jira-tempo/` y `packages/gitlab/` | Refactor de tests (solo mover) |
| Crear `packages/mcp-core` con código compartido | Lógica de dominio (Jira, Tempo, Gitlab) |
| Crear `packages/_template` como scaffold | npm workspaces en producción |
| Root configs únicos: eslint, prettier, gitignore | Express/web dashboard (solo jira-tempo) |
| `MCP_JIRA_TEMPO_SPEC.md` → `docs/jira-tempo-spec.md` | Contenido de `openspec/specs/` |
| CI unificada con matrix strategy | Variables de entorno (se quedan por server) |
| Root `package.json` con dev tooling | |

## Capacidades

Refactor estructural puro. Sin cambios en comportamiento observable ni en el contrato MCP.

- **Nuevas**: Ninguna
- **Modificadas**: Ninguna

## ADRs (Architecture Decision Records)

| # | Decisión | Rationale |
|---|----------|-----------|
| 1 | Servidores bajo `packages/` con naming scoped `@config-mcp/*` | Consistencia monorepo, separación clara para futuros servers |
| 2 | NO npm workspaces. Cada server independiente. mcp-core via `"file:../../packages/mcp-core"` | Dockerfiles simples, builds sin dependencias cruzadas en producción |
| 3 | mcp-core: rateLimit (configurable), security, sanitizers, AppError, ValidationError. Domain errors se quedan por server | AppError/ValidationError son idénticos; JiraError, TempoError, GitlabError son específicos |
| 4 | CI unificada con matrix `[jira-tempo, gitlab]` | Un solo workflow, menos mantenimiento, ejecución paralela |
| 5 | Root configs únicos (eslint, prettier, gitignore) | Elimina duplicación exacta entre servers |
| 6 | rateLimit.minTime configurable vía parámetro (no env) | Un solo rateLimit.js acepta `minTime` como argumento — cada server define el suyo |
| 7 | `_template` es scaffold + documentación, no código reusable | El patrón server.js es repetitivo pero cada server tiene imports/dominio únicos no templateables |

## Árbol Final

```
config-mcp/
├── packages/
│   ├── mcp-core/src/{middleware,utils}/
│   ├── jira-tempo/src/{config,jira,tempo,middleware,schemas,tools}/
│   │             ├── web/{server,public/index.html}/
│   │             └── tests/
│   ├── gitlab/src/{config,gitlab,utils,middleware,schemas,tools}/
│   │             └── tests/{fixtures,unit}/
│   └── _template/src/{config,middleware,schemas}/
├── docs/jira-tempo-spec.md
├── .github/workflows/ci.yml
├── eslint.config.js, .prettierrc, .gitignore
├── package.json (root)
└── README.md
```

## Inventario de Archivos

| Operación | Origen → Destino |
|-----------|------------------|
| Mover | `jira-tempo-mcp/` → `packages/jira-tempo/` |
| Mover | `gitlab-mcp/` → `packages/gitlab/` |
| Crear | `packages/mcp-core/` |
| Crear | `packages/_template/` |
| Mover | `MCP_JIRA_TEMPO_SPEC.md` → `docs/jira-tempo-spec.md` |
| Mover | `eslint.config.js` (x2) → raíz (1 solo unificado) |
| Mover | `.prettierrc` (x2) → raíz (1 solo unificado) |
| Mover | `.gitignore` (x2) → raíz (1 solo unificado) |

**Renombres internos** (service/package name `*-mcp` → `*`):
- `package.json`: `"name"` → `"@config-mcp/jira-tempo"` / `"@config-mcp/gitlab"`
- `server.js`: `name:` → `'jira-tempo'` / `'gitlab'`
- `logger.js`: `service:` → `'jira-tempo'` / `'gitlab'`
- `docker-compose.yml`: service/container name sin sufijo `-mcp`
- `README.md`: paths a `./packages/...`

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| rateLimit.minTime difiere (200 vs 100) | Alta | Hacerlo configurable vía parámetro en mcp-core |
| Tests de gitlab con paths relativos se rompen | Baja | Árbol interno se preserva (`../../src/` sigue funcionando) |
| CI unificada rompe build de Docker | Media | Usar `working-directory` y context paths por matrix |
| Express innecesario en gitlab si se globaliza | Baja | Cada server mantiene sus propias `dependencies` |
| Rename de `name` inconsistente (3 campos por server) | Media | `git grep 'jira-tempo-mcp\|gitlab-mcp'` post-migración |

## Fases

| # | Fase | Depende de |
|---|------|------------|
| 1 | Crear `packages/mcp-core` + `packages/_template` | — |
| 2 | Mover `jira-tempo-mcp/` → `packages/jira-tempo/` + rename internos | 1 (si importa core) |
| 3 | Mover `gitlab-mcp/` → `packages/gitlab/` + rename internos | 1 (si importa core) |
| 4 | Mover configs raíz (eslint, prettier, gitignore, root pkg.json) | 2-3 |
| 5 | Unificar CI + mover spec a `docs/` | 2-4 |
| 6 | Integrar mcp-core en ambos servers (imports de rateLimit, security, sanitizers, errors) | 1-3 |
| 7 | Verificación final: tests, lint, build, despliegue | Todas |

## Rollback

Cada fase es un commit independiente → `git revert <hash>`. Rollback total: `git checkout main && git branch -D feature/monorepo-restructure`. Si se aplican fases 1-5 sin fase 6, el rollback de fase 6 es revertir los package.json que agregan la dependencia a mcp-core.

## Criterios de Éxito

- [ ] Todos los tests existentes pasan (jira-tempo y gitlab)
- [ ] `npm run lint` en raíz sin errores
- [ ] Cada server arranca (`node src/server.js`)
- [ ] CI matrix ejecuta ambos packages correctamente
- [ ] `git grep 'jira-tempo-mcp\|gitlab-mcp'` = 0 resultados (solo histórico en git log)
