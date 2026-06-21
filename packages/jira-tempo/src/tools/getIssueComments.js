import { getIssueComments } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetIssueComments(args) {
  const { issueKey } = validate(schemas.issueKey, args);

  const result = await getIssueComments(issueKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
