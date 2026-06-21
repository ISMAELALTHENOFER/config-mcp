# Archive Report: monorepo-restructure

**Archived**: 2026-06-21
**Source**: `openspec/changes/monorepo-restructure/`
**Destination**: `openspec/changes/archive/2026-06-21-monorepo-restructure/`
**Archive Type**: intentional-with-warnings

## Archive Summary

The monorepo-restructure change restructured the flat server directories into a `packages/` monorepo layout with shared `mcp-core` library, unified root configs, and GitHub Actions CI. All 7 phases were implemented and verified.

## Artifacts Archived

| Artifact | Status |
|----------|--------|
| `exploration.md` | ✅ |
| `proposal.md` | ✅ |
| `design.md` | ✅ |
| `tasks.md` | ✅ (91/91 tasks complete) |
| `specs/` | N/A — no delta specs directory existed |

## Task Completion Gate

All 91 checkboxes in `tasks.md` were marked `[x]`. Gate passed.

**Note**: The `tasks.md` checkboxes were reconciled post-facto by the orchestrator with explicit user approval. The implementing sub-agent did not update the tasks artifact during apply. Every checkbox reflects work confirmed completed by apply-progress and the verify phase (188/190 tests passing, lint clean, git grep 0 results, git status clean).

## Specs Sync

No `specs/` subdirectory existed in the change folder. No delta specs to merge into main specs.

Main specs directory (`openspec/specs/`) contains specs for unrelated domains (`gitlab-file-read`, `gitlab-mr-read`) — this was the first SDD iteration for monorepo-restructure, so no prior main specs existed for this change.

## Verification Status

- ✅ **Tests**: packages/jira-tempo: 29/29 passing; packages/gitlab: 159/161 passing (2 pre-existing failures in env.test.js confirmed against original commit)
- ✅ **Lint**: Clean (ESLint 9 flat config)
- ✅ **Format**: Prettier check clean
- ✅ **Git grep**: 0 references to old paths (`jira-tempo-mcp`, `gitlab-mcp`)
- ✅ **Git status**: Clean working tree

## Unplanned Artifacts

- `docs/gitlab-spec.md` — created during implementation outside the original task plan. Documents the GitLab MCP server specification. Not part of the SDD artifact set.

## ESLint Config Change

During implementation, `ecmaVersion` in the root ESLint config was updated from `2022` to `'latest'` to support the `with { type: 'json' }` syntax used in the package. This was a necessary adjustment caught during the apply phase.

## Risks Discovered

None. All verification gates passed cleanly. The 2 pre-existing test failures in gitlab's `env.test.js` are unrelated to this change and pre-date the restructure.

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
