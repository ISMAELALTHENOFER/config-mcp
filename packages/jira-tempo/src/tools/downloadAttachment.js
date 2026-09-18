import { getAttachment } from '../jira/jiraService.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleDownloadAttachment(args) {
  const { issueKey, attachmentId } = validate(schemas.attachment, args);
  const attachment = await getAttachment(issueKey, attachmentId);
  return { content: [{ type: 'text', text: JSON.stringify(attachment, null, 2) }] };
}
