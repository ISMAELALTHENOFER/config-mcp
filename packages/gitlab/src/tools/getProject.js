import { z } from 'zod';
import { getProject } from '../gitlab/gitlabService.js';

const GetProjectSchema = z.object({
  projectPath: z.string().min(1, 'Project path is required'),
});

export async function handleGetProject(args) {
  const parsed = GetProjectSchema.parse(args);

  const project = await getProject(parsed.projectPath);

  return {
    content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
  };
}
