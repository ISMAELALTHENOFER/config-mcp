import { getReleases } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetRelease(args) {
  const { projectKey } = validate(schemas.projectKey, args);

  const result = await getReleases(projectKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
