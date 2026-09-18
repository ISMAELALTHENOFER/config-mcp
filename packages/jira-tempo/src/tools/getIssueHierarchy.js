import { getIssueHierarchy } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleGetIssueHierarchy(args) {
  const { issueKey } = validate(schemas.issueKey, args);
  const result = await getIssueHierarchy(issueKey);

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}
