import { z } from 'zod';
import { getPullRequest } from '../github/githubService.js';
import { parsePullRequestUrl } from '../utils/urlParser.js';

const GetPullRequestSchema = z
  .object({
    url: z.string().url().optional(),
    repository: z.string().optional(),
    pullNumber: z.coerce.number().int().positive().optional(),
  })
  .refine((data) => data.url || (data.repository && data.pullNumber !== undefined), {
    message: 'Either url or (repository + pullNumber) is required',
  });

export async function handleGetPullRequest(args) {
  const parsed = GetPullRequestSchema.parse(args);

  let repository;
  let pullNumber;

  if (parsed.url) {
    const result = parsePullRequestUrl(parsed.url);
    repository = result.repository;
    pullNumber = result.pullNumber;
  } else {
    repository = parsed.repository;
    pullNumber = parsed.pullNumber;
  }

  const pull = await getPullRequest(repository, pullNumber);

  return {
    content: [{ type: 'text', text: JSON.stringify(pull, null, 2) }],
  };
}
