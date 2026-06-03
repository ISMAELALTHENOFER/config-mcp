import { getIssue } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetIssue(args) {
  const { issueKey } = validate(schemas.issueKey, args);

  const result = await getIssue(issueKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
