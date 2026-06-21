import { getProjectMetrics } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetProjectMetrics(args) {
  const { projectKey } = validate(schemas.projectKey, args);

  const result = await getProjectMetrics(projectKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
