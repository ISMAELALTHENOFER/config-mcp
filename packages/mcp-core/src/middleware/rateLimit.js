import Bottleneck from 'bottleneck';

// Default Bottleneck instance for direct use in API clients (HTTP rate limiting)
export const limiter = new Bottleneck({ minTime: 200, maxConcurrent: 5 });

/**
 * Creates an MCP middleware wrapper around a Bottleneck limiter.
 * Use this for rate-limiting MCP tool calls in server.js.
 * @param {number} minTime - Minimum time (ms) between calls. Default 200.
 */
export function createRateLimitMiddleware(minTime = 200) {
  const toolLimiter = new Bottleneck({ minTime, maxConcurrent: 5 });
  return {
    name: 'rateLimit',
    async handler(request, next) {
      return toolLimiter.schedule(() => next());
    },
  };
}
