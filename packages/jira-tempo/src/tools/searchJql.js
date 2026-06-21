import { z } from 'zod';
import { searchJql } from '../jira/jiraService.js';
import { schemas } from '../middleware/validation.js';

const searchJqlSchema = z.object({
  jql: schemas.jql.shape.jql,
  maxResults: schemas.maxResults.optional(),
});

export async function handleSearchJql(args) {
  const parsed = searchJqlSchema.parse(args);
  const maxResults = parsed.maxResults ?? 50;

  const result = await searchJql(parsed.jql, maxResults);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
