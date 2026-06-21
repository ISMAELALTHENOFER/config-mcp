import { tempoGet } from './tempoClient.js';
import {
  mapWorklogsResponse,
  aggregateHours,
} from './tempoMapper.js';
import { jiraGet } from '../jira/jiraClient.js';
import { TempoError } from '../utils/errors.js';

export async function getWorklogsByIssue(issueKey) {
  try {
    const jiraIssue = await jiraGet(`/rest/api/3/issue/${issueKey}`, {
      fields: 'id',
    });
    const issueId = jiraIssue.id;

    const data = await tempoGet('/worklogs/issue/' + issueId);
    return mapWorklogsResponse(data);
  } catch (error) {
    throw new TempoError(
      `Failed to get worklogs for ${issueKey}: ${error.message}`,
    );
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
    throw new TempoError(
      `Failed to get user hours for ${accountId}: ${error.message}`,
    );
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
    throw new TempoError(
      `Failed to get team hours for team ${teamId}: ${error.message}`,
    );
  }
}

export async function getIssueHours(issueKey) {
  const result = await getWorklogsByIssue(issueKey);
  const aggregated = aggregateHours(result.worklogs);
  return {
    issueKey,
    ...aggregated,
    worklogs: result.worklogs,
  };
}
