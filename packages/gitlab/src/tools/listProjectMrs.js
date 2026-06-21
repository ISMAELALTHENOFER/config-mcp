import { z } from 'zod';
import { listProjectMrs } from '../gitlab/gitlabService.js';

const ListProjectMrsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  state: z.enum(['opened', 'closed', 'merged', 'all']).optional(),
  labels: z.string().optional(),
  search: z.string().optional(),
});

export async function handleListProjectMrs(args) {
  const parsed = ListProjectMrsSchema.parse(args);

  const filters = {};
  if (parsed.state) filters.state = parsed.state;
  if (parsed.labels) filters.labels = parsed.labels;
  if (parsed.search) filters.search = parsed.search;

  const mrs = await listProjectMrs(parsed.projectId, filters);

  return {
    content: [{ type: 'text', text: JSON.stringify(mrs, null, 2) }],
  };
}
