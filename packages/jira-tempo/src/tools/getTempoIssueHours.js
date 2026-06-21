import { getIssueHours } from '../tempo/tempoService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetTempoIssueHours(args) {
  const { issueKey } = validate(schemas.issueKey, args);

  const result = await getIssueHours(issueKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
