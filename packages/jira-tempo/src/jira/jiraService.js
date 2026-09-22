import { createHash } from 'node:crypto';
import { jiraGet, jiraGetBytes } from './jiraClient.js';
import {
  buildMyTasksJql,
  buildBlockedIssuesJql,
  buildEpicStoriesJql,
  buildProjectMetricsJql,
  buildIssueChildrenJql,
  FIELDS_DEFAULT,
  FIELDS_ISSUE_DETAIL,
} from './jiraQueries.js';
import {
  mapSearchResults,
  mapIssueDetail,
  mapProject,
  mapBoard,
  mapSprint,
  mapVersion,
  mapComments,
  mapIssueHierarchy,
  mapAttachments,
} from './jiraMapper.js';
import { JiraError } from '../utils/errors.js';
import {
  assertSafeAttachment,
  assertSafeSqlAttachment,
  inspectSqlAttachmentBytes,
  MAX_SQL_ATTACHMENT_BYTES,
} from './sqlAnalysis.js';
import { env } from '../config/env.js';

function safeAttachmentUrl(content) {
  if (!content) throw new Error('Selected attachment has no download URL.');
  const url = new URL(content, env.JIRA_BASE_URL);
  if (url.origin !== new URL(env.JIRA_BASE_URL).origin || url.username || url.password) {
    throw new Error('Selected attachment has an unsupported download origin.');
  }
  return url.href;
}

async function findAttachment(issueKey, attachmentId) {
  const issue = await jiraGet(`/rest/api/3/issue/${issueKey}`, { fields: 'attachment' });
  const attachment = (issue.fields?.attachment || []).find(
    (item) => item.id === attachmentId,
  );
  if (!attachment) throw new Error('Selected attachment was not found on the issue.');
  return attachment;
}

export async function getAttachment(issueKey, attachmentId) {
  try {
    const attachment = await findAttachment(issueKey, attachmentId);
    assertSafeAttachment(attachment);
    const bytes = await jiraGetBytes(
      safeAttachmentUrl(attachment.content),
      MAX_SQL_ATTACHMENT_BYTES,
    );
    const hash = createHash('sha256').update(bytes).digest('hex');
    return {
      issueKey,
      attachmentId,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      bytes: bytes.length,
      sha256: hash,
      content: Buffer.from(bytes),
    };
  } catch (error) {
    throw new JiraError(
      `Failed to retrieve attachment for ${issueKey}: ${error.message}`,
    );
  }
}

export async function getSqlAttachment(issueKey, attachmentId) {
  try {
    const attachment = await findAttachment(issueKey, attachmentId);
    assertSafeSqlAttachment(attachment);
    const contentUrl = safeAttachmentUrl(attachment.content);
    const entries = inspectSqlAttachmentBytes(
      attachment,
      await jiraGetBytes(contentUrl, MAX_SQL_ATTACHMENT_BYTES),
    );
    return {
      issueKey,
      attachmentId,
      filename: attachment.filename,
      bytes: attachment.size,
      entries,
      sql: entries.map((entry) => entry.sql).join('\n'),
    };
  } catch (error) {
    throw new JiraError(
      `Failed to retrieve SQL attachment for ${issueKey}: ${error.message}`,
    );
  }
}

export async function searchJql(jql, maxResults = 50) {
  try {
    const data = await jiraGet('/rest/api/3/search/jql', {
      jql,
      maxResults,
      fields: FIELDS_DEFAULT,
    });
    return mapSearchResults(data);
  } catch (error) {
    throw new JiraError(`Search failed: ${error.message}`);
  }
}

export async function getIssue(issueKey) {
  try {
    const data = await jiraGet(`/rest/api/3/issue/${issueKey}`, {
      fields: FIELDS_ISSUE_DETAIL,
    });
    return mapIssueDetail(data);
  } catch (error) {
    throw new JiraError(`Failed to get issue ${issueKey}: ${error.message}`);
  }
}

export async function getIssueHierarchy(issueKey) {
  try {
    const [issue, children] = await Promise.all([
      jiraGet(`/rest/api/3/issue/${issueKey}`, {
        fields: 'summary,status,issuetype,parent,project',
      }),
      searchJql(buildIssueChildrenJql(issueKey), 500),
    ]);
    return mapIssueHierarchy(issue, children.issues);
  } catch (error) {
    throw new JiraError(`Failed to get hierarchy for ${issueKey}: ${error.message}`);
  }
}

export async function getIssueAttachments(issueKey) {
  try {
    const issue = await jiraGet(`/rest/api/3/issue/${issueKey}`, {
      fields: 'attachment',
    });
    return {
      issueKey,
      attachments: mapAttachments(issue),
    };
  } catch (error) {
    throw new JiraError(`Failed to get attachments for ${issueKey}: ${error.message}`);
  }
}

export async function getProject(projectKey) {
  try {
    const data = await jiraGet(`/rest/api/3/project/${projectKey}`);
    return mapProject(data);
  } catch (error) {
    throw new JiraError(`Failed to get project ${projectKey}: ${error.message}`);
  }
}

export async function getEpic(epicKey) {
  const epic = await getIssue(epicKey);
  const storiesData = await searchJql(buildEpicStoriesJql(epicKey), 200);
  return {
    epic,
    stories: storiesData.issues,
    totalStories: storiesData.total,
  };
}

export async function getSprint(sprintId) {
  try {
    const data = await jiraGet(`/rest/agile/1.0/sprint/${sprintId}`);
    return mapSprint(data);
  } catch (error) {
    throw new JiraError(`Failed to get sprint ${sprintId}: ${error.message}`);
  }
}

export async function getBoard(boardId) {
  try {
    const data = await jiraGet(`/rest/agile/1.0/board/${boardId}`);
    return mapBoard(data);
  } catch (error) {
    throw new JiraError(`Failed to get board ${boardId}: ${error.message}`);
  }
}

export async function getReleases(projectKey) {
  try {
    const data = await jiraGet(`/rest/api/3/project/${projectKey}/versions`);
    return data.map(mapVersion);
  } catch (error) {
    throw new JiraError(`Failed to get releases for ${projectKey}: ${error.message}`);
  }
}

export async function getMyTasks(maxResults = 50) {
  return searchJql(buildMyTasksJql(), maxResults);
}

export async function getBlockedIssues(projectKey, maxResults = 50) {
  return searchJql(buildBlockedIssuesJql(projectKey), maxResults);
}

export async function getIssueComments(issueKey) {
  try {
    const data = await jiraGet(`/rest/api/3/issue/${issueKey}/comment`);
    return mapComments(data);
  } catch (error) {
    throw new JiraError(`Failed to get comments for ${issueKey}: ${error.message}`);
  }
}

export async function getProjectMetrics(projectKey) {
  const queries = buildProjectMetricsJql(projectKey);

  try {
    const [allRes, openRes, inProgressRes, doneRes] = await Promise.all([
      jiraGet('/rest/api/3/search/jql', {
        jql: queries.all,
        maxResults: 0,
      }),
      jiraGet('/rest/api/3/search/jql', {
        jql: queries.open,
        maxResults: 0,
      }),
      jiraGet('/rest/api/3/search/jql', {
        jql: queries.inProgress,
        maxResults: 0,
      }),
      jiraGet('/rest/api/3/search/jql', {
        jql: queries.done,
        maxResults: 0,
      }),
    ]);

    return {
      projectKey,
      total: allRes.total,
      open: openRes.total,
      inProgress: inProgressRes.total,
      done: doneRes.total,
    };
  } catch (error) {
    throw new JiraError(`Failed to get metrics for ${projectKey}: ${error.message}`);
  }
}
