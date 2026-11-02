import { z } from 'zod';
import { getPullRequestFiles } from '../github/githubService.js';

const GetPullRequestFilesSchema = z.object({
  repository: z.string().min(1, 'Repository is required'),
  pullNumber: z.coerce
    .number()
    .int()
    .positive('Pull request number must be a positive integer'),
});

export async function handleGetPullRequestFiles(args) {
  const parsed = GetPullRequestFilesSchema.parse(args);

  const files = await getPullRequestFiles(parsed.repository, parsed.pullNumber);

  return {
    content: [{ type: 'text', text: JSON.stringify(files, null, 2) }],
  };
}
