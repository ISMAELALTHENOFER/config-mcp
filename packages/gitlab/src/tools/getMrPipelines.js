import { z } from 'zod';
import { getMrPipelines } from '../gitlab/gitlabService.js';

const GetMrPipelinesSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  mrIid: z.coerce.number().int().positive('MR IID must be a positive integer'),
});

export async function handleGetMrPipelines(args) {
  const parsed = GetMrPipelinesSchema.parse(args);

  const pipelines = await getMrPipelines(parsed.projectId, parsed.mrIid);

  return {
    content: [{ type: 'text', text: JSON.stringify(pipelines, null, 2) }],
  };
}
