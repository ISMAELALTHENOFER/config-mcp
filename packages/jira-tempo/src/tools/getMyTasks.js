import { getMyTasks } from '../jira/jiraService.js';

export async function handleGetMyTasks(args) {
  const maxResults = args?.maxResults || 50;

  const result = await getMyTasks(maxResults);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
