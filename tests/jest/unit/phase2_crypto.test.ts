import { describe, it, expect } from 'vitest';
import { CryptoService } from '@/lib/crypto';

describe('CryptoService (Phase 2)', () => {
    it('should encrypt and decrypt correctly', () => {
        const secret = 'MySecretData123';
        const encrypted = CryptoService.encrypt(secret);

        expect(encrypted).not.toBe(secret);
        expect(encrypted).toContain(':'); // IV:Content format

        const decrypted = CryptoService.decrypt(encrypted);
        expect(decrypted).toBe(secret);
    });

    it('should return original text if not encrypted (fallback)', () => {
        const plain = 'NotEncrypted';
        const result = CryptoService.decrypt(plain);
        expect(result).toBe(plain);
    });

    it('should handle empty strings', () => {
        expect(CryptoService.encrypt('')).toBe('');
        expect(CryptoService.decrypt('')).toBe('');
    });
});
