# GitLab MR Read Specification

## Purpose

Read merge request data from GitLab: MR details, diffs, comments, approvals, pipelines, and MR listings. Supports SaaS (gitlab.com) and self-hosted instances via `GITLAB_BASE_URL`. All tools are read-only — no write operations occur under any conditions.

## Requirements

### Requirement: get_mr

The system MUST return full MR details given either a full MR URL or `projectPath` + `mrIid`.

#### Scenario: By URL

- GIVEN a valid MR URL like `https://gitlab.example.com/group/project/-/merge_requests/42`
- WHEN called with `url`
- THEN return title, description, state, author, source/target branches, dates, and web URL

#### Scenario: By params

- GIVEN a valid `projectPath` and numeric `mrIid`
- WHEN called with those parameters
- THEN return the same fields as the URL path

#### Scenario: MR not found

- GIVEN a non-existent MR IID
- WHEN called
- THEN return a typed error indicating not found

#### Scenario: Invalid URL

- GIVEN a malformed URL
- WHEN called with `url`
- THEN return a validation error

### Requirement: get_mr_diffs

The system MUST return file changes (diff) for a merge request.

#### Scenario: Happy path

- GIVEN a valid project and MR IID with changes
- WHEN called
- THEN return each file with path, status (added/modified/deleted), and unified diff

#### Scenario: No changes

- GIVEN an MR with no file changes
- WHEN called
- THEN return an empty changes array

### Requirement: get_mr_comments

The system MUST return discussion threads for a merge request.

#### Scenario: With notes

- GIVEN an MR with discussions
- WHEN called
- THEN return each thread with author, body, created date, and thread ID

#### Scenario: No comments

- GIVEN an MR with zero discussions
- WHEN called
- THEN return an empty threads array

### Requirement: get_mr_approvals

The system MUST return approval state and list of approvers.

#### Scenario: Approved

- GIVEN an approved MR
- WHEN called
- THEN return `approved: true`, approvers list, and approval count

#### Scenario: Not approved

- GIVEN an MR not yet approved
- WHEN called
- THEN return `approved: false` with empty approvers list

### Requirement: get_mr_pipelines

The system MUST return CI pipeline statuses for an MR.

#### Scenario: Happy path

- GIVEN an MR with pipelines
- WHEN called
- THEN return each pipeline with ID, status, ref, and web URL

#### Scenario: No pipelines

- GIVEN an MR without triggered pipelines
- WHEN called
- THEN return an empty pipelines array

### Requirement: list_project_mrs

The system MUST return a paginated, filterable list of MRs for a project.

#### Scenario: Default list

- GIVEN a valid `projectPath`
- WHEN called without filters
- THEN return up to 20 open MRs ordered by creation date descending

#### Scenario: State filter

- GIVEN a `projectPath` and `state: merged`
- WHEN called
- THEN return only merged MRs

#### Scenario: Empty project

- GIVEN a project with no MRs
- WHEN called
- THEN return an empty list

### Requirement: get_project

The system MUST return project metadata by URL-encoded path.

#### Scenario: Happy path

- GIVEN a valid `projectPath` (e.g., `group/subgroup/project`)
- WHEN called
- THEN return id, name, description, web URL, visibility, and default branch

#### Scenario: Not found

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
