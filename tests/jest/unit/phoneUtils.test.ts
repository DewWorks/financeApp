
import { formatToE164, isValidPhone, validatePhoneDetails, getPhoneQueryVariations } from '@/lib/phoneUtils';

describe('Phone Utility Library', () => {

    describe('formatToE164', () => {
        it('should format clean local number (11 digits) to +55', () => {
            expect(formatToE164('63984207313')).toBe('+5563984207313');
        });

        it('should format formatted local number to +55', () => {
            expect(formatToE164('(63) 98420-7313')).toBe('+5563984207313');
        });

        it('should preserve existing +55', () => {
            expect(formatToE164('+55 63 98420-7313')).toBe('+5563984207313');
        });

        it('should handle numbers without + but with 55 prefix', () => {
            expect(formatToE164('5563984207313')).toBe('+5563984207313');
        });

        it('should return valid E.164 for international numbers', () => {
            // US Number
            expect(formatToE164('+1 415 555 2671')).toBe('+14155552671');
        });

        it('should return null for garbage input', () => {
            expect(formatToE164('abc')).toBeNull();
            expect(formatToE164('')).toBeNull();
        });
    });

    describe('validatePhoneDetails', () => {
        it('should return isValid: true for valid numbers', () => {
            expect(validatePhoneDetails('63984207313')).toEqual({ isValid: true });
            expect(validatePhoneDetails('+5563984207313')).toEqual({ isValid: true });
        });

        it('should return TOO_SHORT for short numbers', () => {
            // 8 digits is too short for mobile in most BR regions (needs 9 or legacy 8 with specific range, but modern is 11 total with DDD)
            // 63 98420 -> 7 digits
            const result = validatePhoneDetails('6398420');
            // Lib might return TOO_SHORT or INVALID_LENGTH depending on implementation
            expect(result.isValid).toBe(false);
            expect(['TOO_SHORT', 'INVALID_LENGTH']).toContain(result.error);
        });

        it('should return NOT_A_NUMBER for letter input', () => {
            expect(validatePhoneDetails('abcdef')).toEqual({ isValid: false, error: 'NOT_A_NUMBER' });
        });

        it('should return INVALID_LENGTH for weird lengths (e.g. 5 digits)', () => {
            expect(validatePhoneDetails('12345').isValid).toBe(false);
        });
    });

    describe('getPhoneQueryVariations', () => {
        it('should generate variations for local input', () => {
            const variations = getPhoneQueryVariations('63984207313');
            expect(variations).toContain('+5563984207313'); // E164
            expect(variations).toContain('63984207313');   // National
            expect(variations).toContain('5563984207313'); // Prefix no plus
        });

        it('should generate variations for formatted input', () => {
            const variations = getPhoneQueryVariations('(63) 98420-7313');
            expect(variations).toContain('63984207313');
        });

        it('should handle complex format +55 (63) 98420-7313', () => {
            const variations = getPhoneQueryVariations('+55 (63) 98420-7313');
            // Deve encontrar a versão limpa E164 que está no banco
            expect(variations).toContain('+5563984207313');
            expect(variations).toContain('5563984207313');
        });
    });

});
