import dotenv from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the monorepo root
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  GITHUB_TOKEN: z.string().min(1),
  // Override for GitHub Enterprise Server (e.g. https://ghe.example.com/api/v3)
  GITHUB_API_URL: z.string().url().default('https://api.github.com'),

  MCP_PORT: z.coerce.number().default(3000),
  MCP_LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Missing or invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
