export function buildMyTasksJql() {
  return 'assignee = currentUser() ORDER BY updated DESC';
}

export function buildBlockedIssuesJql(projectKey) {
  const base = 'status = Blocked';
  return projectKey
    ? `${base} AND project = "${projectKey}" ORDER BY updated DESC`
    : `${base} ORDER BY updated DESC`;
}

export function buildEpicStoriesJql(epicKey) {
  return `"Epic Link" = ${epicKey} ORDER BY status`;
}

export function buildProjectMetricsJql(projectKey) {
  return {
    all: `project = "${projectKey}"`,
    open: `project = "${projectKey}" AND statusCategory = "To Do"`,
    inProgress: `project = "${projectKey}" AND statusCategory = "In Progress"`,
    done: `project = "${projectKey}" AND statusCategory = "Done"`,
  };
}

export function buildIssueByKeyJql(issueKey) {
  return `key = ${issueKey}`;
}

export const FIELDS_DEFAULT = [
  'summary',
  'status',
  'assignee',
  'priority',
  'issuetype',
  'created',
  'updated',
  'duedate',
  'project',
  'labels',
  'fixVersions',
].join(',');

export const FIELDS_ISSUE_DETAIL = [
  'summary',
  'description',
  'status',
  'assignee',
  'reporter',
  'priority',
  'issuetype',
  'created',
  'updated',
  'duedate',
  'project',
  'labels',
  'fixVersions',
  'components',
  'subtasks',
  'parent',
  'customfield_10014',
].join(',');
