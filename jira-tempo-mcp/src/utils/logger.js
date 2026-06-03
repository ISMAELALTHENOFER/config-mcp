import winston from 'winston';
import { env } from '../config/env.js';

export const logger = winston.createLogger({
  level: env.MCP_LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'jira-tempo-mcp' },
  transports: [new winston.transports.Console()],
});
