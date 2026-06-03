import { getSprint } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetSprint(args) {
  const { sprintId } = validate(schemas.sprintId, args);

  const result = await getSprint(sprintId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
