import { z } from 'zod';
import { getRepository } from '../github/githubService.js';

const GetRepositorySchema = z.object({
  repository: z.string().min(1, 'Repository is required'),
});

export async function handleGetRepository(args) {
  const parsed = GetRepositorySchema.parse(args);

  const repository = await getRepository(parsed.repository);

  return {
    content: [{ type: 'text', text: JSON.stringify(repository, null, 2) }],
  };
}
