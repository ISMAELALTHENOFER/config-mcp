import { z } from 'zod';
import { getMrApprovals } from '../gitlab/gitlabService.js';

const GetMrApprovalsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  mrIid: z.coerce.number().int().positive('MR IID must be a positive integer'),
});

export async function handleGetMrApprovals(args) {
  const parsed = GetMrApprovalsSchema.parse(args);

  const approvals = await getMrApprovals(parsed.projectId, parsed.mrIid);

  return {
    content: [{ type: 'text', text: JSON.stringify(approvals, null, 2) }],
  };
}
