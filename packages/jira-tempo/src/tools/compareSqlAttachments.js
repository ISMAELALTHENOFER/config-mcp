import { getSqlAttachment } from '../jira/jiraService.js';
import { compareSql } from '../jira/sqlAnalysis.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleCompareSqlAttachments(args) {
  const input = validate(schemas.sqlAttachmentComparison, args);
  const [first, second] = await Promise.all([
    getSqlAttachment(input.firstIssueKey, input.firstAttachmentId),
    getSqlAttachment(input.secondIssueKey, input.secondAttachmentId),
  ]);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            primera: {
              issueKey: first.issueKey,
              attachmentId: first.attachmentId,
              filename: first.filename,
            },
            segunda: {
              issueKey: second.issueKey,
              attachmentId: second.attachmentId,
              filename: second.filename,
            },
            comparacion: compareSql(first.sql, second.sql),
          },
          null,
          2,
        ),
      },
    ],
  };
}
