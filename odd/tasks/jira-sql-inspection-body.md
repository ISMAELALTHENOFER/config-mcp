# Jira SQL inspection body

Objective: Enable the read-only review agent to inspect the actual SQL inside a selected Jira SQL or ZIP attachment and give evidence-based order/dependency advice without executing it.

Problem: The inspection tool parses SQL but only returns a summary; the agent consequently asks the user to paste SQL already available to the tool.

Why: Restore a complete, safe evidence path for SQL review.

Scope: `packages/jira-tempo` inspection response/schema/tests and the global `lead-tech` skill. No Jira mutations, SQL execution, or remote operations.

Constraints: Preserve bounded ZIP/UTF-8 validation and the default summary-only response; SQL bodies require explicit opt-in. Do not include confidential attachment contents in tests or logs. Existing worktree changes must be preserved.

Authorized scope: Local files above only. Local branch `fix/jira-sql-inspection-body`; no commit, push or PR without an explicit user request.

TDD: not established for ODD; SDD testing-capabilities cache is not an ODD mode decision. Runner: `npm test` in `packages/jira-tempo` (confirm with package scripts).

Delivery strategy: ask-on-risk. Forecast: under ~400 authored changed lines; track from work-unit commits. First reviewed boundary: branch point `a7c4f6d`.

Tasks:
- [x] T1 (delegated: preparation and multi-file writer): Added opt-in SQL-body inspection and focused tests; updated the global lead-tech skill for source-based standalone reviews. Acceptance: summary-only default preserved; opt-in returns ZIP entries and plain SQL. Checks: 11 suites/52 tests, focused 3 suites/12 tests (also independently rerun), lint and `git diff --check` passed. Commit: none, per user instruction.
- [x] T2 (inline: bounded verification): Confirmed changed paths and unstaged state, independently reran 3 suites/12 tests and `git diff --check`. No live Jira, SQL execution or database validation. Native committed-only review not started: no commit authorized. Commit: none, per user instruction.

Progress: Local implementation and checks complete; no changes staged or committed. The global skill change takes effect after restarting OpenCode. Next: user can exercise the revised agent after restart; commit/push/PR only if explicitly requested.
