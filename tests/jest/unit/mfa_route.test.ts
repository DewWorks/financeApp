import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/mfa/send/route';
import { NextRequest } from 'next/server';
import { MfaService } from '@/lib/MfaService';
import * as RateLimit from '@/lib/rateLimit';

// Mocks
vi.mock('@/db/connectionDb', () => ({
    getMongoClient: vi.fn().mockResolvedValue({
        db: () => ({
            collection: () => ({
                findOne: vi.fn().mockResolvedValue({ _id: 'FoundUser' }), // Default found
            }),
        }),
    }),
}));

vi.mock('@/lib/MfaService', () => ({
    MfaService: {
        sendOtp: vi.fn(),
    },
}));

vi.mock('@/lib/rateLimit', () => ({
    mfaRequestLimiter: {},
    checkRateLimit: vi.fn(),
}));

describe('MFA Send Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (RateLimit.checkRateLimit as any).mockResolvedValue(true); // Allow by default
    });

    it('should return 400 if userId or channel is missing', async () => {
        const req = new NextRequest('http://localhost/api/auth/mfa/send', {
            method: 'POST',
            body: JSON.stringify({ userId: '' }),
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('should return 429 if rate limit is exceeded', async () => {
        (RateLimit.checkRateLimit as any).mockResolvedValue(false); // Block
        const validId = '507f1f77bcf86cd799439011'; // Valid 24-char Hex
        const req = new NextRequest('http://localhost/api/auth/mfa/send', {
            method: 'POST',
            body: JSON.stringify({ userId: validId, channel: 'email' }),
        });
        const res = await POST(req);
        expect(res.status).toBe(429);
    });

    it('should call MfaService.sendOtp and return 200 on success', async () => {
        (MfaService.sendOtp as any).mockResolvedValue(true);
        const validId = '507f1f77bcf86cd799439011'; // Valid 24-char Hex
        const req = new NextRequest('http://localhost/api/auth/mfa/send', {
            method: 'POST',
            body: JSON.stringify({ userId: validId, channel: 'email' }),
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(MfaService.sendOtp).toHaveBeenCalledWith(validId, 'email');
    });
});
