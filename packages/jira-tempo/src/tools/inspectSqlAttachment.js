import { getSqlAttachment } from '../jira/jiraService.js';
import { describeSql } from '../jira/sqlAnalysis.js';
import { validate, schemas } from '../middleware/validation.js';

export async function handleInspectSqlAttachment(args) {
  const { issueKey, attachmentId } = validate(schemas.sqlAttachment, args);
  const attachment = await getSqlAttachment(issueKey, attachmentId);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            archivo: {
              issueKey,
              attachmentId,
              filename: attachment.filename,
              bytes: attachment.bytes,
            },
            entradas: attachment.entries.map((entry) => ({
              filename: entry.filename,
              bytes: entry.bytes,
              descripcion: describeSql(entry.sql),
            })),
            limitaciones:
              'No valida esquemas, sintaxis Oracle, dependencias u orden; no ejecuta SQL ni prueba pipelines, aprobaciones o producción.',
          },
          null,
          2,
        ),
      },
    ],
  };
}
