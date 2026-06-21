import { z } from 'zod';
import { listBranches } from '../gitlab/gitlabService.js';

const ListBranchesSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  search: z.string().optional(),
});

export async function handleListBranches(args) {
  const parsed = ListBranchesSchema.parse(args);

  const branches = await listBranches(parsed.projectId, parsed.search);

  return {
    content: [{ type: 'text', text: JSON.stringify(branches, null, 2) }],
  };
}
