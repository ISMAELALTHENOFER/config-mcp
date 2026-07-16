import dotenv from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde la raíz del monorepo
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  ORACLE_USER: z.string().min(1),
  ORACLE_PASSWORD: z.string().min(1),
  ORACLE_CONNECT_STRING: z.string().min(1),

  MCP_LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Missing or invalid environment variables (oracle-db):');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
