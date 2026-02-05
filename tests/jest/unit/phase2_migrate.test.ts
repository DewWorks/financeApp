import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/maintenance/migrate/route';
import { CryptoService } from '@/lib/crypto';

// Real Crypto for the test logic? Or mock it? 
// Let's use Real crypto to verify flow, mocking DB.

const updateOneMock = vi.fn();

vi.mock('@/db/connectionDb', () => ({
    getMongoClient: vi.fn().mockResolvedValue({
        db: () => ({
            collection: () => ({
                find: () => ({
                    toArray: vi.fn().mockResolvedValue([
                        { _id: '1', cpf: '12345678900' }, // Plaintext -> Should update
                        { _id: '2', cpf: 'abc:encrypted' }, // Encrypted -> Should skip
                        { _id: '3', address: 'Rua Teste 123' }, // Plaintext -> Should update
                    ])
                }),
                updateOne: updateOneMock
            })
        })
    })
}));

describe('Migration Route (Phase 2)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should iterate users and encrypt only plaintext fields', async () => {
        const req = new Request('http://localhost/api/maintenance/migrate');
        const res = await GET(req);

        expect(res.status).toBe(200);

        // Expect 2 updates (User 1 and User 3)
        // User 2 should be skipped or not result in updateOne call
        expect(updateOneMock).toHaveBeenCalledTimes(2);

        // Check if encryption happened (args[1] is { $set: ... })
        const firstCall = updateOneMock.mock.calls[0];
        expect(firstCall[1].$set.cpf).toMatch(/:/); // Should be encrypted (IV:Cipher)
    });
});
