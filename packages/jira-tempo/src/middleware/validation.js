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
  sqlAttachment: z.object({
    issueKey: z.string().regex(issueKeyRegex, 'Invalid issue key format'),
    attachmentId: z.string().min(1).max(100),
  }),
  sqlAttachmentComparison: z.object({
    firstIssueKey: z.string().regex(issueKeyRegex, 'Invalid issue key format'),
    firstAttachmentId: z.string().min(1).max(100),
    secondIssueKey: z.string().regex(issueKeyRegex, 'Invalid issue key format'),
    secondAttachmentId: z.string().min(1).max(100),
  }),
  teamWorkloadSummary: z.object({
    accountIds: z.array(z.string().min(1)).min(1).max(50).refine((ids) => new Set(ids).size === ids.length, 'Account IDs must be unique'),
    from: z.string().date(),
    to: z.string().date(),
    timezone: z.string().min(1).max(100).refine((timezone) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: timezone });
        return true;
      } catch {
        return false;
      }
    }, 'Invalid IANA timezone'),
    weekStartsOn: z.enum(['monday', 'sunday']),
    dailyThresholdHours: z.number().min(0).max(24),
    weeklyThresholdHours: z.number().min(0).max(168),
  }).refine((value) => value.from <= value.to, { message: 'from must be on or before to', path: ['to'] }),
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
