# Diseño: monorepo-restructure

## Technical Approach

Reestructuración del monorepo moviendo dos servidores MCP existentes (`jira-tempo-mcp/`, `gitlab-mcp/`) a `packages/`, extrayendo código compartido a `packages/mcp-core`, unificando tooling raíz, y estableciendo `packages/_template` como scaffold documentado. Zero cambios de comportamiento. Cada commit representa una fase reversible.

## Arquitectura de mcp-core

```
packages/mcp-core/
├── src/
│   ├── middleware/
│   │   ├── rateLimit.js      # Factory: createRateLimitMiddleware(minTime)
│   │   └── security.js       # sanitizeHeaders(), redactCredentials()
│   └── utils/
│       ├── sanitizers.js     # redactSensitive(), redactUrl()
│       └── errors.js         # AppError, ValidationError
└── package.json              # @config-mcp/mcp-core
```

### rateLimit.js

```js
export function createRateLimitMiddleware(minTime = 200) {
  const limiter = new Bottleneck({ minTime, maxConcurrent: 5 });
  return {
    name: 'rateLimit',
    async handler(request, next) {
      return limiter.schedule(() => next());
    },
  };
}
```

**Uso por server**: `createRateLimitMiddleware(200)` (jira-tempo), `createRateLimitMiddleware(100)` (gitlab).

### security.js

Extraído de `jira-tempo-mcp/src/middleware/security.js`. Genérico — sanitiza headers y detecta credenciales en raw responses. Sin dependencias de dominio.

### sanitizers.js

Extraído de `jira-tempo-mcp/src/utils/sanitizers.js`. Exporta `sanitizeHeaders`, `sanitizeUrl`, `sanitizeConfig`, `sanitizeError`. `sanitizeConfig` mantiene las keys Jira/Tempo por ser función utilitaria genérica (redacta cualquier config con esas keys).

### errors.js

Extraído de ambos servers (contenido idéntico). Solo `AppError` y `ValidationError`.

```js
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}
```

**No van a core**: `JiraError`, `TempoError`, `GitlabError` — se quedan en cada server.

### package.json

```json
{
  "name": "@config-mcp/mcp-core",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "dependencies": {
    "bottleneck": "^2.19.5"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

### src/index.js (barrel)

```js
export { createRateLimitMiddleware } from './middleware/rateLimit.js';
export {
  sanitizeHeaders, sanitizeUrl, sanitizeConfig, sanitizeError,
} from './utils/sanitizers.js';
export { createSecurityMiddleware, redactCredentials } from './middleware/security.js';
export { AppError, ValidationError } from './utils/errors.js';
```

## Arquitectura de _template

```
packages/_template/
├── src/
│   ├── config/
│   │   └── env.js              # Pattern: dotenv + Zod, placeholders comentados
│   ├── middleware/
│   │   └── validation.js       # Pattern: Zod schema factory, ejemplo comentado
│   ├── schemas/
│   │   └── toolSchemas.js      # Pattern: ALL_TOOLS export, 1 tool comentada
│   └── server.js               # Skeleton completo con todos los patrones
├── Dockerfile                  # Layout estándar
├── docker-compose.yml          # Layout estándar
└── package.json                # @config-mcp/template placeholder
```

Cada archivo documenta el patrón esperado. `server.js` incluye: imports (SDK, env, logger, ALL_TOOLS, rateLimit, handlers), TOOL_HANDLERS map, creación de Server, handlers ListTools + CallTool, error wrapper, y main().

## Migración jira-tempo

### git mv

1. `git mv jira-tempo-mcp packages/jira-tempo`
2. `git rm packages/jira-tempo/.github/workflows/ci.yml` (se moverá a root CI)
3. `git rm packages/jira-tempo/eslint.config.js` (pasa a root)
4. `git rm packages/jira-tempo/.prettierrc` (pasa a root)
5. `git rm packages/jira-tempo/.gitignore` (pasa a root)
6. Borrar source de security.js y sanitizers.js (pasaron a mcp-core)

### Renombres internos

| Archivo | Línea | Original → Nuevo |
|---------|-------|-------------------|
| `package.json` | `name` | `"jira-tempo-mcp"` → `"@config-mcp/jira-tempo"` |
| `package.json` | (nueva) | Agregar `"@config-mcp/mcp-core": "file:../../packages/mcp-core"` en dependencies |
| `src/server.js` | 54 | `name: 'jira-tempo-mcp'` → `name: 'jira-tempo'` |
| `src/server.js` | 10 | `'./middleware/rateLimit.js'` → `'@config-mcp/mcp-core'` |
| `src/server.js` | 50 | `createRateLimitMiddleware()` → `createRateLimitMiddleware(200)` |
| `src/server.js` | 121 | `'Jira Tempo MCP Server running'` → `'Jira Tempo Server running'` |
| `src/utils/logger.js` | 10 | `service: 'jira-tempo-mcp'` → `service: 'jira-tempo'` |
| `docker-compose.yml` | 2-3 | `jira-tempo-mcp` → `jira-tempo` |

### Mantener

- `web/` (Express dashboard)
- `test_web.ps1`
- `src/jira/` (todo)
- `src/tempo/` (todo)
- `src/tools/` (todo)
- `src/middleware/validation.js` (Zod schemas específicos)
- `tests/` (4 tests)

### Quitar (movido a mcp-core)

- `src/middleware/security.js` → eliminar, importar de `@config-mcp/mcp-core`
- `src/utils/sanitizers.js` → eliminar, importar de `@config-mcp/mcp-core`
- `src/utils/errors.js`: dejar solo `JiraError` y `TempoError`, eliminar `AppError` y `ValidationError`

## Migración gitlab

### git mv

1. `git mv gitlab-mcp packages/gitlab`
2. `git rm packages/gitlab/eslint.config.js`
3. `git rm packages/gitlab/.prettierrc`
4. `git rm packages/gitlab/.gitignore`

### Renombres internos

| Archivo | Línea | Original → Nuevo |
|---------|-------|-------------------|
| `package.json` | `name` | `"gitlab-mcp"` → `"@config-mcp/gitlab"` |
| `package.json` | (nueva) | Agregar `"@config-mcp/mcp-core": "file:../../packages/mcp-core"` en dependencies |
| `src/server.js` | 38 | `name: 'gitlab-mcp'` → `name: 'gitlab'` |
| `src/server.js` | 10 | `'./middleware/rateLimit.js'` → `'@config-mcp/mcp-core'` |
| `src/server.js` | 34 | `createRateLimitMiddleware()` → `createRateLimitMiddleware(100)` |
| `src/server.js` | 105 | `'GitLab MCP Server running'` → `'GitLab Server running'` |
| `src/utils/logger.js` | 10 | `service: 'gitlab-mcp'` → `service: 'gitlab'` |
| `docker-compose.yml` | 2-3 | `gitlab-mcp` → `gitlab` |

### Mantener

- `jest.config.js`
- `tests/fixtures/` (8 fixtures)
- `tests/unit/` (12 tests)
- `src/utils/urlParser.js` (único de gitlab)
- `src/gitlab/` (todo)
- `src/tools/` (todo)
- `src/middleware/validation.js` (Zod schemas específicos)

### Quitar (movido a mcp-core)

- `src/utils/errors.js`: dejar solo `GitlabError`, eliminar `AppError` y `ValidationError`

## Root Configuration

### package.json (raíz)

```json
{
  "name": "@config-mcp/root",
  "private": true,
  "type": "module",
  "scripts": {
    "lint": "eslint packages/",
    "lint:fix": "eslint packages/ --fix",
    "format": "prettier --write \"packages/**/*.js\"",
    "format:check": "prettier --check \"packages/**/*.js\""
  },
  "devDependencies": {
    "@eslint/js": "^9.24.0",
    "eslint": "^9.24.0",
    "globals": "^16.0.0",
    "prettier": "^3.5.3"
  }
}
```

Sin `workspaces`. Dev tooling solo en raíz.

### eslint.config.js (raíz)

Idéntico al existente en los packages, ignorando `node_modules/`, `dist/`, `coverage/`, `logs/`. Se eliminan las copias en `packages/jira-tempo/` y `packages/gitlab/`.

### .prettierrc (raíz)

Mismo contenido actual. Se eliminan las copias en packages.

### .gitignore (raíz)

Mismo contenido actual (node_modules, .env, dist, coverage, logs, .vscode, .idea, .DS_Store, Thumbs.db). Se eliminan las copias en packages.

## CI/CD

### `.github/workflows/ci.yml` (nuevo, en raíz)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [jira-tempo, gitlab]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies (${{ matrix.package }})
        working-directory: packages/${{ matrix.package }}
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Format check
        run: npm run format:check
      - name: Run tests
        working-directory: packages/${{ matrix.package }}
        run: npm test
        env:
          JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL || 'https://test.atlassian.net' }}
          JIRA_EMAIL: ${{ secrets.JIRA_EMAIL || 'test@test.com' }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN || 'test' }}
          TEMPO_API_TOKEN: ${{ secrets.TEMPO_API_TOKEN || 'test' }}
          GITLAB_BASE_URL: ${{ secrets.GITLAB_BASE_URL || 'https://gitlab.com' }}
          GITLAB_PERSONAL_ACCESS_TOKEN: ${{ secrets.GITLAB_PERSONAL_ACCESS_TOKEN || 'test' }}
```

**Docker build** se omite en este workflow para mantener separación de responsabilidades (build puede ir en workflow aparte o post-merge).

### Migración

- Crear `.github/workflows/ci.yml` en raíz
- Eliminar `packages/jira-tempo/.github/workflows/ci.yml` (antiguo)
- `git rm --cached packages/jira-tempo/.github/` completo

## Phase Dependency Graph

```
Fase 1: mcp-core + _template  (sin dependencias)
  │
  ├── Fase 2: jira-tempo       (depende de 1 para imports a mcp-core)
  │     │
  │     └── Fase 4: Root configs (eslint, prettier, gitignore, root pkg)
  │           │
  │           └── Fase 5: CI unificada + docs/spec
  │
  └── Fase 3: gitlab           (depende de 1 para imports a mcp-core)
        │
        └── Fase 4 (misma que arriba)

Fase 6: Integrar mcp-core en servers (imports rateLimit, security, errors)
  │
  └── Fase 7: Verificación final (tests, lint, build)
```

Las fases pueden hacerse en este orden, con 2 y 3 paralelizables.

## Verification Checklist

Después de cada fase, ejecutar:

| Fase | Comando | Esperado |
|------|---------|----------|
| 1 (mcp-core) | `node --check packages/mcp-core/src/index.js` | Sin errores |
| 2 (jira-tempo) | `cd packages/jira-tempo && npm test` | Tests pasan |
| 2 (jira-tempo) | `node --check packages/jira-tempo/src/server.js` | Sin errores de import |
| 3 (gitlab) | `cd packages/gitlab && npm test` | Tests pasan |
| 3 (gitlab) | `node --check packages/gitlab/src/server.js` | Sin errores de import |
| 4 (root) | `npm run lint` | Sin errores |
| 4 (root) | `npm run format:check` | Sin errores |
| 5 (CI) | Revisar que `.github/workflows/ci.yml` referencie `packages/...` | Correcto |
| 6 (mcp-core integration) | Tests de ambos servers | Pasan |
| 7 (final) | `git grep 'jira-tempo-mcp\|gitlab-mcp'` | 0 resultados |
| 7 (final) | `git status` | Sin cambios no staged |

### grep de verificación post-migración

```bash
# Buscar residuos de nombres viejos en el código (no en git log)
git grep -n 'jira-tempo-mcp' -- ':!*.md' ':(exclude)*.github*'
git grep -n 'gitlab-mcp' -- ':!*.md' ':(exclude)*.github*'
```

Si retorna líneas (excluyendo READMEs y docs), hay renombres pendientes.

## Open Questions

- Ninguna. La exploración y el proposal cubren todos los casos de borde.
