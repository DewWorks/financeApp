import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate Limiter for Login Attempts
// Allow 5 attempts per 15 minutes per IP
export const loginLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60 * 15,
});

// Rate Limiter for Start MFA (e.g., requesting SMS/Email code repeatedly)
// Allow 3 attempts per minute
export const mfaRequestLimiter = new RateLimiterMemory({
    points: 3,
    duration: 60,
});

// Rate Limiter for Verify MFA (guessing the code)
// Allow 5 attempts per 5 minutes
export const mfaVerifyLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60 * 5,
});

/**
 * Helper to check rate limit in Next.js API Routes
 * Returns true if allowed, false if blocked.
 * Throws error if blocked? Better to return boolean or throw to catch.
 */
export async function checkRateLimit(limiter: RateLimiterMemory, key: string): Promise<boolean> {
    try {
        await limiter.consume(key);
        return true;
    } catch (rejRes) {
        return false;
    }
}
