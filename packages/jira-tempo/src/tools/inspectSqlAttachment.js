import { getSqlAttachment } from '../jira/jiraService.js';
import { describeSql } from '../jira/sqlAnalysis.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleInspectSqlAttachment(args) {
  const { issueKey, attachmentId } = validate(schemas.sqlAttachment, args);
  const attachment = await getSqlAttachment(issueKey, attachmentId);
  return { content: [{ type: 'text', text: JSON.stringify({ archivo: { issueKey, attachmentId, filename: attachment.filename, bytes: attachment.bytes }, descripcion: describeSql(attachment.sql) }, null, 2) }] };
}
