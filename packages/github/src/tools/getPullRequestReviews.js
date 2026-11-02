import { z } from 'zod';
import { getPullRequestReviews } from '../github/githubService.js';

const GetPullRequestReviewsSchema = z.object({
  repository: z.string().min(1, 'Repository is required'),
  pullNumber: z.coerce
    .number()
    .int()
    .positive('Pull request number must be a positive integer'),
});

export async function handleGetPullRequestReviews(args) {
  const parsed = GetPullRequestReviewsSchema.parse(args);

  const reviews = await getPullRequestReviews(parsed.repository, parsed.pullNumber);

  return {
    content: [{ type: 'text', text: JSON.stringify(reviews, null, 2) }],
  };
}
