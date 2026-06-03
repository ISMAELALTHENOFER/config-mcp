import { z } from 'zod';

const issueKeyRegex = /^[A-Z][A-Z0-9]+-\d+$/;
const projectKeyRegex = /^[A-Z][A-Z0-9]+$/;

export const schemas = {
  issueKey: z.object({
    issueKey: z.string().regex(issueKeyRegex, 'Invalid issue key format'),
  }),
  epicKey: z.object({
    epicKey: z.string().regex(issueKeyRegex, 'Invalid epic key format'),
  }),
  projectKey: z.object({
    projectKey: z.string().regex(projectKeyRegex, 'Invalid project key format'),
  }),
  sprintId: z.object({
    sprintId: z.number().int().positive(),
  }),
  boardId: z.object({
    boardId: z.number().int().positive(),
  }),
  teamId: z.object({
    teamId: z.number().int().positive(),
  }),
  jql: z.object({
    jql: z.string().min(1).max(2000),
  }),
  dateRange: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  }),
  maxResults: z.number().int().min(1).max(500).default(50),
  accountId: z.object({
    accountId: z.string().min(1),
  }),
};

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`,
    );
    throw new Error(`Validation failed: ${messages.join('; ')}`);
  }
  return result.data;
}
