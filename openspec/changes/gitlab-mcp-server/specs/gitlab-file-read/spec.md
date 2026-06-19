# GitLab File Read Specification

## Purpose

Read file content from GitLab repository branches and list repository branches. All tools are read-only — no write operations occur under any conditions.

## Requirements

### Requirement: get_file_content

The system MUST return raw file content from a repository given a file path and ref (branch or commit SHA).

#### Scenario: By branch name

- GIVEN a valid `projectPath`, `filePath` (e.g., `src/index.js`), and `ref` (e.g., `main`)
- WHEN called
- THEN return the file content as text and metadata (size, encoding, last commit info)

#### Scenario: By commit SHA

- GIVEN a valid `projectPath`, `filePath`, and a commit SHA as `ref`
- WHEN called
- THEN return the file content as it existed at that commit

#### Scenario: File not found

- GIVEN a non-existent file path
- WHEN called
- THEN return a typed error indicating the file was not found

#### Scenario: Ref not found

- GIVEN a non-existent branch or commit SHA
- WHEN called
- THEN return a typed error indicating the ref was not found

#### Scenario: Binary file

- GIVEN a file that GitLab categorizes as binary (e.g., .png, .pdf)
- WHEN called
- THEN return the raw base64 content with a content type indicator

### Requirement: Path validation

The system MUST reject file paths that attempt directory traversal outside the repository root.

#### Scenario: Path traversal attempt

- GIVEN a file path containing `../` sequences
- WHEN called
- THEN return a validation error before making any API request

### Requirement: list_branches

The system MUST list branches for a repository with their latest commit information.

#### Scenario: Happy path

- GIVEN a valid `projectPath`
- WHEN called without filters
- THEN return each branch with name, last commit SHA, last commit message, and author

#### Scenario: With search filter

- GIVEN a `projectPath` and `search` parameter (e.g., `feature/`)
- WHEN called
- THEN return only branches whose name matches the search string

#### Scenario: Project not found

- GIVEN a non-existent project path
- WHEN called
- THEN return a typed error indicating project not found

### Requirement: Error consistency

The system MUST return typed errors for auth and network failures across all tools.

#### Scenario: Invalid token

- GIVEN an expired or invalid `GITLAB_PERSONAL_ACCESS_TOKEN`
- WHEN any tool is called
- THEN return a 401 typed error

#### Scenario: Insufficient permissions

- GIVEN a valid token that lacks access to the resource (403)
- WHEN any tool is called
- THEN return a 403 typed error

#### Scenario: Network error

- GIVEN an unreachable GitLab instance
- WHEN any tool is called
- THEN return a typed network error
