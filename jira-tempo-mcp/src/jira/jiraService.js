import { jiraGet } from './jiraClient.js';
import {
  buildMyTasksJql,
  buildBlockedIssuesJql,
  buildEpicStoriesJql,
  buildProjectMetricsJql,
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
} from './jiraMapper.js';
import { JiraError } from '../utils/errors.js';

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
    throw new JiraError(
      `Failed to get comments for ${issueKey}: ${error.message}`,
    );
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
    throw new JiraError(
      `Failed to get metrics for ${projectKey}: ${error.message}`,
    );
  }
}
