import { z } from 'zod';
import { getFileContent } from '../github/githubService.js';

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
  repository: z.string().min(1, 'Repository is required'),
  filePath: z.string().min(1, 'File path is required').refine(noPathTraversal, {
    message: 'File path with directory traversal (../) is not allowed',
  }),
  ref: z.string().optional(),
});

export async function handleGetFileContent(args) {
  const parsed = GetFileContentSchema.parse(args);

  const fileContent = await getFileContent(
    parsed.repository,
    parsed.filePath,
    parsed.ref,
  );

  return {
    content: [{ type: 'text', text: JSON.stringify(fileContent, null, 2) }],
  };
}
