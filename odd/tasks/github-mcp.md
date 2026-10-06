# GitHub MCP server

Objective: Add `packages/github`, a read-only GitHub MCP server that mirrors the existing `packages/gitlab` server in structure, conventions, tooling and docs.

Problem: The monorepo exposes GitLab, Jira/Tempo and Oracle to AI assistants but nothing for GitHub, where the repo's own PRs live.

Why: Consistent read-only access to GitHub repositories, pull requests, reviews, checks and file contents with the same security, validation and error model as the GitLab server.

Scope: New `packages/github` (src, tests, Dockerfile, docker-compose, jest config, README), `docs/github-spec.md`, root `README.md`, `.env.example`, `openspec/config.yaml` context line. No changes to gitlab, jira-tempo, oracle packages or mcp-core unless a shared bug is found (then report, do not fix silently).

Constraints: Read-only tools only. Follow `packages/gitlab` layout exactly (client / service / mapper / tools / schemas / middleware / utils / config). Reuse `packages/mcp-core`. Technical artifacts in English. No push, PR or merge. No live GitHub calls; tests use mocks and fixtures.

Tool mapping (GitLab -> GitHub): get_project -> get_repository; list_project_mrs -> list_pull_requests; get_mr -> get_pull_request; get_mr_diffs -> get_pull_request_files; get_mr_comments -> get_pull_request_comments; get_mr_approvals -> get_pull_request_reviews; get_mr_pipelines -> get_pull_request_checks; list_branches -> list_branches; get_file_content -> get_file_content.

Acceptance criteria:
- Server starts via `node --check src/server.js` and registers all 9 tools with Zod schemas and the shared validation/rate-limit middleware.
- Env config, URL parsing (owner/repo, PR URLs), client (auth token, pagination, error mapping), mapper and service mirror the GitLab equivalents.
- Per-tool unit tests plus client/service/mapper/env/server/middleware/utils tests, with fixtures; Jest green.
- ESLint clean on new files; README, spec doc, root README and `.env.example` updated consistently.

Resolved settings: TDD on (source: `openspec/config.yaml` apply.tdd/strict_tdd). Runner: `cd packages/github && node --experimental-vm-modules node_modules/jest/bin/jest.js --forceExit --detectOpenHandles`. Build check: `node --check src/server.js`. Lint: `npm run lint` from root. Branch: `feat/github-mcp` (from `developer`). Delivery strategy: `feature-branch-chain` (forecast > 400 authored lines; slices = tasks below, PRs target `feat/github-mcp`, final PR to `developer`; none authorized yet). RDD: not assessed yet.

Tasks (each closes with a Conventional Commit):
- [x] T1: Scaffold `packages/github` and core layer: package.json, Dockerfile, docker-compose, jest config, config/env, utils (errors, logger, urlParser), middleware, githubClient, githubMapper, githubService + tests/fixtures. Route: delegated (writer; many non-trivial files, preparation reading delegated with the write). Commit: `feat(github): scaffold package and core layer` Commit hash: 41617b2.
  - Evidence RED: `cd packages/github && node --experimental-vm-modules node_modules/jest/bin/jest.js --forceExit --detectOpenHandles` before any src file existed: 8 suites failed (Cannot find module src/...), only the mcp-core rateLimit suite passed.
  - Evidence GREEN: same command after implementation: Test Suites 9 passed, Tests 97 passed. With `--coverage`: all files 94.17% stmts / 91.86% branches / 96.61% funcs (threshold 90 met).
  - Evidence lint/format: `npm run lint` (root) clean after fixing one eqeqeq finding; `npx prettier --write` applied to packages/github src+tests.
  - `node --check src/server.js`: not applicable yet (server.js lands in T2).
- [x] T2: Tools, schemas and server wiring: 9 tools, toolSchemas, server.js + per-tool tests and server test. Route: delegated (same writer). Commit: `feat(github): add read-only tools and server wiring` Commit hash: 40a78e2.
  - Evidence RED: same jest command with only tests present: 11 suites failed (9 tool suites, server, toolSchemas), 9 core suites passed.
  - Evidence GREEN: `Test Suites: 20 passed, 20 total; Tests: 156 passed, 156 total`; coverage 95.62% stmts / 92.51% branches / 97.14% funcs.
  - `node --check src/server.js` (from packages/github): OK (exit 0).
  - `npm run lint` (root): clean, no findings. `npx prettier --write` applied to packages/github src+tests.
- [x] T3: Docs and wiring: packages/github/README, docs/github-spec.md, root README, .env.example, openspec context. Route: delegated (same writer). Commit: `docs(github): document github mcp server` Commit hash: a53d033.
  - Evidence: docs-only task, so no RED. After the edits: jest `Test Suites: 20 passed; Tests: 156 passed`, `node --check src/server.js` OK, `npx prettier --check "src/**/*.js"` clean, `npm run lint` (root) clean.
  - Not done (out of listed scope): `.github/workflows/ci.yml` matrix still lists only jira-tempo, gitlab, oracle-db; adding `github` (and `GITHUB_TOKEN` test env) is left to the user.

Verification (final, after T3): `cd packages/github && node --experimental-vm-modules node_modules/jest/bin/jest.js --forceExit --detectOpenHandles` -> 20 suites, 156 tests passed; `node --check src/server.js` -> OK; `npm run lint` (root) -> clean; `npx prettier --check "src/**/*.js"` -> clean. No live GitHub calls were made (mocks and fixtures only). Authored changed lines vs `developer` (additions + deletions, excluding this document and packages/github/package-lock.json): 4476 (T1 2352, T2 1279, T3 845), above the ~400 planning heuristic because tests and fixtures dominate; all slices are still one coherent behavior each.

Deviations from the GitLab mirror (intentional): `get_pull_request_files` returns `{ files, truncated }` (GitHub's 3000-file cap) instead of a bare array; users are `{ id, login }` (no display name in list payloads); `get_pull_request_reviews` has no required-approval counts (not in REST) and adds `changesRequestedBy`; comments merge conversation and inline review threads with `resolved: null`; branch search and `merged`/`labels` PR filters are client-side; `list_branches` has no `merged`/`default`/commit message fields; pagination follows Link `rel="next"` sequentially (page number only); extra env `GITHUB_API_URL` with default for GitHub Enterprise.

Progress: T1, T2, T3 done and committed on `feat/github-mcp` (41617b2, 40a78e2, a53d033). RDD not assessed. Nothing pushed.

Next step: parent decides RDD assessment/review, CI matrix update for `github`, and slice PRs (feature-branch-chain).
