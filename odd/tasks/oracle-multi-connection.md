# Oracle multi-connection MCP

Objective: merge `oracle-db`, `oracle-db-test` and the `oracle-db-29` registration into one `oracle-db` MCP server with named connections and per-connection permissions, registered in Claude Code and OpenCode.
Branch: `feat/oracle-multi-connection`. Delivery: ask-on-risk. Test runner: Jest (`npm test --prefix packages/oracle-db`).

## Specs

- S1: "que sea solamente 1 mcp que permita varias conexiones a varias bases" — one server, named connections defined in `connections.json` (reference: `D:\DESARROLLOS\mcp-oracle-testing 2`), every tool takes an optional `connection`.
- S2: "que le puedas poner diferentes tipos de permisos" — per connection: read-only (default), `write` (DML), `allowDdl` (DML + DDL).
- S3: "El agente puede leer los bloques plsql pero no ejecutar." — PL/SQL blocks (BEGIN/DECLARE/CALL/EXEC) are always rejected by `execute`; reading source via `query` stays allowed.
- S4: "modificar los 3 mcp que tenemos actualmente db bd-test y db-29 para que las 3 convivan un una tanto para claude code como para opencode" — connections `dev` (former oracle-db), `test` (former oracle-db-test), `dgrm29` (former oracle-db-29); one registration in `~/.claude.json` and `~/.config/opencode/opencode.json`; OpenCode agents that reference the old tool names are updated and keep read-only access (assumption: `compita` and `lead-tech` must not get `execute`).
- S5 (assumption): without `connections.json` the server falls back to one `default` connection from `ORACLE_USER`/`ORACLE_PASSWORD`/`ORACLE_CONNECT_STRING`, read-only.

## Tasks

- [x] T1 [S1-S3, S5] inline — unified package: config, pools, SQL guard, tools `list_connections` + `execute`, tests, delete `oracle-db-test`, docs. Evidence: 38 Jest tests green, lint + prettier clean, stdio smoke test (tools/list, list_connections, PL/SQL rejection). RED not observed first (tests written alongside code).
- [x] T2 [S4] inline — outside the repo: `~/.claude.json` and `opencode.json` now register one `oracle-db` (env adds `ORACLE_29_*`); `oracle-db-29`/`oracle-db-test` removed; `crack-de-la-revision` and `compita` deny `oracle-db_execute`; `compita.md` and `lead-tech/SKILL.md` use `connection: "dev"|"test"`. Backups in session scratchpad.

## Log

- L1 (2026-11-01): "quiero que me modifiques este conjunto de mcp pero la parte de oracle-db y oracle-db-test para que sea solamente 1 mcp que permita varias conexiones a varias bases y que le puedas poner diferentes tipos de permisos "D:\DESARROLLOS\mcp-oracle-testing 2" me pasaron este como para que lo puedas tener de referencia. dudas?"
- L2 (2026-11-01): "El agente puede leer los bloques plsql pero no ejecutar. si la idea es modificar los 3 mcp que tenemos actualmente db bd-test y db-29 para que las 3 convivan un una tanto para claude code como para opencode"
- L3: Reference gap noted: PL/SQL under `write` bypasses `allowDdl` via EXECUTE IMMEDIATE; resolved by S3. Thick mode from the reference skipped: current servers run thin mode against these bases.
- L4: Live ping with real client env resolved dev (.40), test (.65 from root .env) and dgrm29 (.29) but all timed out (NJS-510, network/VPN). `opencode mcp list` fails with "no such column: project_id" with both original and new configs (pre-existing, unrelated).
