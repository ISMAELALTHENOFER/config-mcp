// ---- ENVIRONMENT CONFIGURATION PATTERN ----
// Each server validates its environment variables at import time using dotenv + Zod.
// This guarantees the server fails fast on misconfiguration, never at runtime.
//
// 1. Load .env file into process.env
// 2. Define a Zod schema with all required/optional env vars
// 3. Parse and export the validated config object
//
// Copy this file to your new server and replace SCHEMA_NAME with your
// server's schema (e.g., MyServerConfig).

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Replace this schema with your server's environment variables.
// Each field MUST have a description so failures are self-documenting.
const SCHEMA_NAME = z.object({
  // MCP standard
  MCP_PORT: z.string().default('3000'),
  MCP_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Example: external API credentials
  // MY_API_URL: z.string().url(),
  // MY_API_TOKEN: z.string().min(1),
});

const parsed = SCHEMA_NAME.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
