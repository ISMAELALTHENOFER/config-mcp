# GitLab MR comparison evidence

Objective: Make the read-only GitLab MCP provide complete, reproducible evidence to compare the 12 Developer MRs with intranet !832, excluding SQL attachments.

Problem: The diff tool fetches one page and hides omission flags; MR responses omit immutable revision identifiers; raw file content advertises an incorrect encoding. Empty diff text cannot prove a change is absent.

Why: A reviewer must distinguish omitted diff data from an actual empty change and compare files at fixed commit references rather than moving branches.

Scope: `packages/gitlab` API client, service, mappers, tools and focused tests/docs only. No Jira, Oracle, SQL attachment, or intranet source changes.

Authorized scope: Read and edit only the new worktree `D:\DESARROLLOS\config-mcp-gitlab-mr-comparison`; preserve the original worktree's unrelated changes. Branch: `feat/gitlab-mr-comparison`. Implementation route: delegated direct; multiple non-trivial source and test files, with preparation delegated to the same writer.

Constraints: Preserve existing MCP tool contracts where possible. Do not call remote GitLab except for already authorized read-only inspection. No push, PR, or merge. Prefer existing pagination and native GitLab revision/blob metadata. Technical artifacts in English.

Acceptance criteria:
- MR diffs enumerate all available pages and expose `collapsed`/`too_large` or equivalent omitted-diff state; omitted text is never silently treated as complete.
- MR responses expose immutable head/base/start revisions needed to bind comparisons when GitLab provides them.
- Raw file retrieval by SHA reports its true encoding and trustworthy content or metadata; clients can distinguish textual content from bytes without inventing hash equivalence.
- Existing behavior remains compatible; focused tests cover pagination, empty/omitted diffs, SHA mapping and file content fidelity.

Tasks:
- [x] T1: Add complete diff pagination and explicit incomplete-diff metadata, with focused checks. Route: delegated; shared service, mapper and tests are non-trivial. Evidence: GitLab package Jest 19 suites/167 tests passed; focused Jest 5 suites/67 tests passed; changed-file ESLint and `git diff --check` passed. No live GitLab call; rollback boundary: GitLab client pagination, service diff fetch, mapper flags and related tests/docs. No commit authorized.
- [x] T2: Expose fixed MR revisions and truthful file-content metadata, update relevant docs and focused checks. Route: delegated; mapper, service and tests are non-trivial. Evidence: `get_mr` maps GitLab-provided `sha` and `diff_refs` without inference; raw file reads preserve bytes and report UTF-8 or base64 with byte size. README and focused tests cover revisions and text/binary fidelity. Fresh GitLab package Jest: 19 suites/167 tests passed; `git diff --check` passed. No live GitLab call; runtime external GitLab boundary N/A (local read-only mock tests). Rollback boundary: GitLab client raw-byte retrieval, MR/file mappers, related tests and README guidance. No commit authorized.

Verification: Fresh `npm test -- --runInBand` in packages/gitlab: 19 suites/167 tests passed. Prior focused `node --experimental-vm-modules node_modules/jest/bin/jest.js --forceExit --detectOpenHandles --runInBand tests/unit/gitlab/gitlabClient.test.js tests/unit/gitlab/gitlabMapper.test.js tests/unit/gitlab/gitlabService.test.js tests/unit/tools/getMrDiffs.test.js tests/unit/tools/getFileContent.test.js` in packages/gitlab: 5 suites/67 tests passed. Prior check-only ESLint on eight changed JS files and fresh `git diff --check`: passed. Check-only Prettier warns on all nine changed files and their HEAD versions; newly added long test lines were wrapped without whole-file normalization. Previous root Jest attempt lacked root dependencies; package Jest now works via an ignored dependency junction. No live GitLab call; runtime external GitLab boundary N/A (local read-only mock tests). TDD mode: off (no explicit ODD setting found in repo); SDD cache does not determine organic mode. Delivery strategy: ask-on-risk; no PR authorized. Running authored lines: 176 (tracked additions + deletions from `git diff --numstat`, excludes this task document). Reviewed boundary: branch point `a7c4f6d`.

Progress: T1 and T2 checked after passing Jest and diff checks; T1 retained its prior focused test and lint evidence. No commits or remote work. GitLab package dependencies are accessible through an ignored junction; root dependencies were linked only for read-only ESLint execution. Prettier --check warns on nine changed files and their HEAD versions; no broad formatting was run.
