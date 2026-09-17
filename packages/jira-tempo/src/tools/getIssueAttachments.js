import { getIssueAttachments } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetIssueAttachments(args) {
  const { issueKey } = validate(schemas.issueKey, args);
  const result = await getIssueAttachments(issueKey);

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}
