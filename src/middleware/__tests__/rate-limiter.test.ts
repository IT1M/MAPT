import { RateLimiter } from '../rate-limiter';
import { NextRequest } from 'next/server';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      windowMs: 1000, // 1 second
      maxRequests: 3,
      keyGenerator: (req) => 'test-key',
    });
  });

  afterEach(() => {
    limiter.clearAll();
  });

  it('should allow requests within limit', () => {
    expect(limiter.check('test-key')).toBe(true);
    expect(limiter.check('test-key')).toBe(true);
    expect(limiter.check('test-key')).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    limiter.check('test-key');
    limiter.check('test-key');
    limiter.check('test-key');
    expect(limiter.check('test-key')).toBe(false);
  });

  it('should reset limit for specific key', () => {
    limiter.check('test-key');
    limiter.check('test-key');
    limiter.check('test-key');

    limiter.reset('test-key');
    expect(limiter.check('test-key')).toBe(true);
  });

  it('should return correct remaining count', () => {
    expect(limiter.getRemaining('test-key')).toBe(3);
    limiter.check('test-key');
    expect(limiter.getRemaining('test-key')).toBe(2);
    limiter.check('test-key');
    expect(limiter.getRemaining('test-key')).toBe(1);
  });

  it('should allow requests after window expires', async () => {
    limiter.check('test-key');
    limiter.check('test-key');
    limiter.check('test-key');

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(limiter.check('test-key')).toBe(true);
  });
});
