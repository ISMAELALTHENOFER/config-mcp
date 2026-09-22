import { tempoGet } from './tempoClient.js';
import { mapWorklogsResponse, aggregateHours } from './tempoMapper.js';
import { jiraGet } from '../jira/jiraClient.js';
import { getEpic, getIssueHierarchy } from '../jira/jiraService.js';
import { TempoError } from '../utils/errors.js';

async function getWorklogsByIssueId(issueId) {
  const data = await tempoGet('/worklogs/issue/' + issueId);
  return mapWorklogsResponse(data);
}

export async function getWorklogsByIssue(issueKey) {
  try {
    const jiraIssue = await jiraGet(`/rest/api/3/issue/${issueKey}`, {
      fields: 'id',
    });
    return await getWorklogsByIssueId(jiraIssue.id);
  } catch (error) {
    throw new TempoError(`Failed to get worklogs for ${issueKey}: ${error.message}`);
  }
}

export async function getUserHours(accountId, from, to) {
  try {
    const data = await tempoGet('/worklogs', {
      accountId,
      from,
      to,
    });
    const mapped = mapWorklogsResponse(data);
    const aggregated = aggregateHours(mapped.worklogs);
    return {
      accountId,
      from,
      to,
      ...aggregated,
      worklogs: mapped.worklogs,
    };
  } catch (error) {
    throw new TempoError(`Failed to get user hours for ${accountId}: ${error.message}`);
  }
}

export async function getProjectHours(projectKey, from, to) {
  try {
    const jiraProject = await jiraGet(`/rest/api/3/project/${projectKey}`);
    const accountId = jiraProject.id;

    const data = await tempoGet('/accounts/' + accountId + '/worklogs', {
      from,
      to,
    });
    const mapped = mapWorklogsResponse(data);
    const aggregated = aggregateHours(mapped.worklogs);
    return {
      projectKey,
      from,
      to,
      ...aggregated,
      worklogs: mapped.worklogs,
    };
  } catch (error) {
    throw new TempoError(
      `Failed to get project hours for ${projectKey}: ${error.message}`,
    );
  }
}

export async function getTeamHours(teamId) {
  try {
    const data = await tempoGet(`/teams/${teamId}/worklogs`);
    const mapped = mapWorklogsResponse(data);
    const aggregated = aggregateHours(mapped.worklogs);
    return {
      teamId,
      ...aggregated,
      worklogs: mapped.worklogs,
    };
  } catch (error) {
    throw new TempoError(`Failed to get team hours for team ${teamId}: ${error.message}`);
  }
}

export async function getIssueHours(issueKey) {
  try {
    const issue = await jiraGet(`/rest/api/3/issue/${issueKey}`, {
      fields: 'id,issuetype',
    });
    const issueKeys = [issueKey];

    const isEpic = issue.fields?.issuetype?.name === 'Epic';
    if (isEpic) {
      const { stories } = await getEpic(issueKey);
      const children = await Promise.all(
        stories.map((story) => getIssueHierarchy(story.key)),
      );
      issueKeys.push(
        ...stories.map((story) => story.key),
        ...children.flatMap((hierarchy) => hierarchy.children.map((child) => child.key)),
      );
    }

    const issueWorklogs = await Promise.all(
      [...new Set(issueKeys)].map(async (key) => ({
        issueKey: key,
        worklogs:
          key === issueKey
            ? (await getWorklogsByIssueId(issue.id)).worklogs
            : (await getWorklogsByIssue(key)).worklogs,
      })),
    );
    const worklogs = issueWorklogs.flatMap((entry) => entry.worklogs);
    const result = {
      issueKey,
      ...aggregateHours(worklogs),
      worklogs,
    };

    if (isEpic) {
      result.breakdown = issueWorklogs.map((entry) => ({
        issueKey: entry.issueKey,
        ...aggregateHours(entry.worklogs),
        worklogs: entry.worklogs,
      }));
    }

    return result;
  } catch (error) {
    throw new TempoError(`Failed to get worklogs for ${issueKey}: ${error.message}`);
  }
}
