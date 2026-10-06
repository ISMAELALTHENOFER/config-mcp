import { z } from 'zod';
import { getPullRequestComments } from '../github/githubService.js';

const GetPullRequestCommentsSchema = z.object({
  repository: z.string().min(1, 'Repository is required'),
  pullNumber: z.coerce
    .number()
    .int()
    .positive('Pull request number must be a positive integer'),
});

export async function handleGetPullRequestComments(args) {
  const parsed = GetPullRequestCommentsSchema.parse(args);

  const comments = await getPullRequestComments(parsed.repository, parsed.pullNumber);

  return {
    content: [{ type: 'text', text: JSON.stringify(comments, null, 2) }],
  };
}
