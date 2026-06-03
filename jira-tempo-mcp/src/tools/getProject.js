import { getProject } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetProject(args) {
  const { projectKey } = validate(schemas.projectKey, args);

  const result = await getProject(projectKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
