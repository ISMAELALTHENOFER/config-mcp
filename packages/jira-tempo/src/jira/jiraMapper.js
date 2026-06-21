function mapStatusCategory(statusCategory) {
  if (!statusCategory) return 'unknown';
  const name = statusCategory.name || statusCategory;
  const map = {
    'To Do': 'open',
    'In Progress': 'inProgress',
    Done: 'done',
  };
  return map[name] || name.toLowerCase();
}

export function mapIssue(raw) {
  const fields = raw.fields || {};
  return {
    key: raw.key,
    summary: fields.summary || '',
    status: fields.status?.name || 'unknown',
    statusCategory: mapStatusCategory(fields.status?.statusCategory),
    assignee: fields.assignee
      ? {
          accountId: fields.assignee.accountId,
          displayName: fields.assignee.displayName,
          email: fields.assignee.emailAddress,
        }
      : null,
    reporter: fields.reporter
      ? {
          accountId: fields.reporter.accountId,
          displayName: fields.reporter.displayName,
        }
      : null,
    priority: fields.priority?.name || null,
    issueType: fields.issuetype?.name || null,
    created: fields.created || null,
    updated: fields.updated || null,
    dueDate: fields.duedate || null,
    project: fields.project
      ? {
          key: fields.project.key,
          name: fields.project.name,
        }
      : null,
    labels: fields.labels || [],
    fixVersions: (fields.fixVersions || []).map((v) => ({
      id: v.id,
      name: v.name,
      released: v.released,
    })),
  };
}

export function mapIssueDetail(raw) {
  const base = mapIssue(raw);
  const fields = raw.fields || {};
  return {
    ...base,
    description: fields.description || '',
    components: (fields.components || []).map((c) => ({
      id: c.id,
      name: c.name,
    })),
    subtasks: (fields.subtasks || []).map((s) => ({
      key: s.key,
      summary: s.fields?.summary || '',
      status: s.fields?.status?.name || 'unknown',
    })),
    parent: fields.parent
      ? {
          key: fields.parent.key,
          summary: fields.parent.fields?.summary || '',
        }
      : null,
    epic: fields.customfield_10014
      ? {
          key: fields.customfield_10014,
        }
      : null,
  };
}

export function mapSearchResults(raw) {
  return {
    total: raw.total,
    maxResults: raw.maxResults,
    startAt: raw.startAt,
    issues: (raw.issues || []).map(mapIssue),
  };
}

export function mapProject(raw) {
  return {
    key: raw.key,
    name: raw.name,
    description: raw.description || '',
    lead: raw.lead?.displayName || null,
    url: raw.self,
    avatarUrl: raw.avatarUrls?.['48x48'] || null,
    projectCategory: raw.projectCategory?.name || null,
  };
}

export function mapBoard(raw) {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    projectKey: raw.location?.projectKey || null,
    projectName: raw.location?.projectName || null,
  };
}

export function mapSprint(raw) {
  return {
    id: raw.id,
    name: raw.name,
    state: raw.state,
    startDate: raw.startDate,
    endDate: raw.endDate,
    boardId: raw.originBoardId,
    goal: raw.goal || '',
  };
}

export function mapComments(raw) {
  return {
    total: raw.total || 0,
    maxResults: raw.maxResults || 0,
    startAt: raw.startAt || 0,
    comments: (raw.comments || []).map((c) => ({
      id: c.id,
      author: c.author
        ? {
            accountId: c.author.accountId,
            displayName: c.author.displayName,
            emailAddress: c.author.emailAddress,
          }
        : null,
      body: c.body || null,
      created: c.created || null,
      updated: c.updated || null,
    })),
  };
}

export function mapVersion(raw) {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || '',
    released: raw.released,
    releaseDate: raw.releaseDate || null,
    overdue: raw.overdue,
    projectKey: raw.project,
  };
}
