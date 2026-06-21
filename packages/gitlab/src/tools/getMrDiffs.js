import { z } from 'zod';
import { getMrDiffs } from '../gitlab/gitlabService.js';

const GetMrDiffsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  mrIid: z.coerce.number().int().positive('MR IID must be a positive integer'),
});

export async function handleGetMrDiffs(args) {
  const parsed = GetMrDiffsSchema.parse(args);

  const diffs = await getMrDiffs(parsed.projectId, parsed.mrIid);

  return {
    content: [{ type: 'text', text: JSON.stringify(diffs, null, 2) }],
  };
}
