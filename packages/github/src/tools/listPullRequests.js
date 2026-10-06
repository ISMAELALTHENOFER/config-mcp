import { z } from 'zod';
import { listPullRequests } from '../github/githubService.js';

const ListPullRequestsSchema = z.object({
  repository: z.string().min(1, 'Repository is required'),
  state: z.enum(['open', 'closed', 'merged', 'all']).optional(),
  base: z.string().optional(),
  head: z.string().optional(),
  labels: z.string().optional(),
});

export async function handleListPullRequests(args) {
  const parsed = ListPullRequestsSchema.parse(args);

  const filters = {};
  if (parsed.state) filters.state = parsed.state;
  if (parsed.base) filters.base = parsed.base;
  if (parsed.head) filters.head = parsed.head;
  if (parsed.labels) filters.labels = parsed.labels;

  const pulls = await listPullRequests(parsed.repository, filters);

  return {
    content: [{ type: 'text', text: JSON.stringify(pulls, null, 2) }],
  };
}
