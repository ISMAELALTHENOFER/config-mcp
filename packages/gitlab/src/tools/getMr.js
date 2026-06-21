import { z } from 'zod';
import { getMr } from '../gitlab/gitlabService.js';
import { parseMrUrl } from '../utils/urlParser.js';

const GetMrSchema = z.object({
  url: z.string().url().optional(),
  projectId: z.string().optional(),
  mrIid: z.coerce.number().int().positive().optional(),
}).refine(
  (data) => data.url || (data.projectId && data.mrIid !== undefined),
  { message: 'Either url or (projectId + mrIid) is required' },
);

export async function handleGetMr(args) {
  const parsed = GetMrSchema.parse(args);

  let projectId;
  let mrIid;

  if (parsed.url) {
    const result = parseMrUrl(parsed.url);
    projectId = result.projectPath;
    mrIid = result.mrIid;
  } else {
    projectId = parsed.projectId;
    mrIid = parsed.mrIid;
  }

  const mr = await getMr(projectId, mrIid);

  return {
    content: [{ type: 'text', text: JSON.stringify(mr, null, 2) }],
  };
}
