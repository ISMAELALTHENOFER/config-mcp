import { getBlockedIssues } from '../jira/jiraService.js';

export async function handleGetBlockedIssues(args) {
  const projectKey = args?.projectKey || null;
  const maxResults = args?.maxResults || 50;

  const result = await getBlockedIssues(projectKey, maxResults);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
