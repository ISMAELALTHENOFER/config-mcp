import { describe, it, expect, jest } from '@jest/globals';
import { createRateLimitMiddleware, limiter } from '../../../src/middleware/rateLimit.js';

describe('middleware/rateLimit', () => {
  it('should export a limiter instance', () => {
    expect(limiter).toBeDefined();
    expect(typeof limiter.schedule).toBe('function');
  });

  it('should create a middleware object with name and handler', () => {
    const middleware = createRateLimitMiddleware();
    expect(middleware).toHaveProperty('name', 'rateLimit');
    expect(typeof middleware.handler).toBe('function');
  });

  it('should call the next function through the limiter', async () => {
    const middleware = createRateLimitMiddleware();
    const next = jest.fn().mockResolvedValue('result');
    const request = {};

    const result = await middleware.handler(request, next);

    expect(next).toHaveBeenCalledWith();
    expect(result).toBe('result');
  });

  it('should pass through errors from the next function', async () => {
    const middleware = createRateLimitMiddleware();
    const next = jest.fn().mockRejectedValue(new Error('test error'));
    const request = {};

    await expect(middleware.handler(request, next)).rejects.toThrow(
      'test error',
    );
  });

  it('should throttle concurrent calls', async () => {
    const middleware = createRateLimitMiddleware();
    let concurrent = 0;
    let maxConcurrent = 0;

    const next = jest.fn().mockImplementation(async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((resolve) => setTimeout(resolve, 50));
      concurrent--;
      return 'done';
    });

    const calls = Array.from({ length: 10 }, () =>
      middleware.handler({}, next),
    );

    await Promise.all(calls);

    expect(maxConcurrent).toBeLessThanOrEqual(5);
    expect(next).toHaveBeenCalledTimes(10);
  }, 10000);
});
