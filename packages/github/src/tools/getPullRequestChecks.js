import { z } from 'zod';
import { getPullRequestChecks } from '../github/githubService.js';

const GetPullRequestChecksSchema = z.object({
  repository: z.string().min(1, 'Repository is required'),
  pullNumber: z.coerce
    .number()
    .int()
    .positive('Pull request number must be a positive integer'),
});

export async function handleGetPullRequestChecks(args) {
  const parsed = GetPullRequestChecksSchema.parse(args);

  const checks = await getPullRequestChecks(parsed.repository, parsed.pullNumber);

  return {
    content: [{ type: 'text', text: JSON.stringify(checks, null, 2) }],
  };
}
