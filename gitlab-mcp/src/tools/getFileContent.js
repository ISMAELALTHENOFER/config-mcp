import { z } from 'zod';
import { getFileContent } from '../gitlab/gitlabService.js';

/**
 * Refinement to reject file paths with directory traversal.
 */
function noPathTraversal(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.includes('..')) {
    return false;
  }
  return true;
}

const GetFileContentSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  filePath: z
    .string()
    .min(1, 'File path is required')
    .refine(noPathTraversal, {
      message: 'File path with directory traversal (../) is not allowed',
    }),
  ref: z.string().optional(),
});

export async function handleGetFileContent(args) {
  const parsed = GetFileContentSchema.parse(args);

  const fileContent = await getFileContent(
    parsed.projectId,
    parsed.filePath,
    parsed.ref,
  );

  return {
    content: [{ type: 'text', text: JSON.stringify(fileContent, null, 2) }],
  };
}
