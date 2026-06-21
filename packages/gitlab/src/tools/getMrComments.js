import { z } from 'zod';
import { getMrComments } from '../gitlab/gitlabService.js';

const GetMrCommentsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  mrIid: z.coerce.number().int().positive('MR IID must be a positive integer'),
});

export async function handleGetMrComments(args) {
  const parsed = GetMrCommentsSchema.parse(args);

  const comments = await getMrComments(parsed.projectId, parsed.mrIid);

  return {
    content: [{ type: 'text', text: JSON.stringify(comments, null, 2) }],
  };
}
