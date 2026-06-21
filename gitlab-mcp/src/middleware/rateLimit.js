import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  minTime: 100,
  maxConcurrent: 5,
});

export function createRateLimitMiddleware() {
  return {
    name: 'rateLimit',
    async handler(request, next) {
      return limiter.schedule(() => next());
    },
  };
}

export { limiter };
