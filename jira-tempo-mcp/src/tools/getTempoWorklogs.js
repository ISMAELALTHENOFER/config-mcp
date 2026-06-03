import { getWorklogsByIssue } from '../tempo/tempoService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetTempoWorklogs(args) {
  const { issueKey } = validate(schemas.issueKey, args);

  const result = await getWorklogsByIssue(issueKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
