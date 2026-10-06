import { z } from 'zod';
import { listBranches } from '../github/githubService.js';

const ListBranchesSchema = z.object({
  repository: z.string().min(1, 'Repository is required'),
  search: z.string().optional(),
});

export async function handleListBranches(args) {
  const parsed = ListBranchesSchema.parse(args);

  const branches = await listBranches(parsed.repository, parsed.search);

  return {
    content: [{ type: 'text', text: JSON.stringify(branches, null, 2) }],
  };
}
