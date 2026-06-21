import { getEpic } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetEpic(args) {
  const { epicKey } = validate(schemas.epicKey, args);

  const result = await getEpic(epicKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
