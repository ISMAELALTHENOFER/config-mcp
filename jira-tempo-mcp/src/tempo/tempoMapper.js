export function mapWorklog(raw) {
  return {
    id: raw.id,
    issueId: raw.issue?.id || null,
    issueKey: raw.issue?.key || null,
    issueSummary: raw.issue?.summary || null,
    timeSpentSeconds: raw.timeSpentSeconds,
    timeSpent: formatSeconds(raw.timeSpentSeconds),
    description: raw.description || '',
    author: raw.author
      ? {
          accountId: raw.author.accountId,
          displayName: raw.author.displayName,
        }
      : null,
    startDate: raw.startDate,
    startTime: raw.startTime,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapWorklogsResponse(raw) {
  return {
    total: raw.metadata?.count || raw.results?.length || 0,
    worklogs: (raw.results || []).map(mapWorklog),
  };
}

export function mapTeam(raw) {
  return {
    id: raw.id,
    name: raw.name,
    summary: raw.summary || '',
    memberCount: raw.membersCount || 0,
  };
}

export function mapAccount(raw) {
  return {
    id: raw.id,
    key: raw.key,
    name: raw.name,
    status: raw.status,
  };
}

function formatSeconds(seconds) {
  if (!seconds) return '0h';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function aggregateHours(worklogs) {
  const totalSeconds = worklogs.reduce(
    (sum, w) => sum + (w.timeSpentSeconds || 0),
    0,
  );
  return {
    totalSeconds,
    formatted: formatSeconds(totalSeconds),
    worklogCount: worklogs.length,
  };
}
