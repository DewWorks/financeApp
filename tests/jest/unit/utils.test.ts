import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatShortDate, getBankDetails, getMonthName } from '@/lib/utils';

describe('Utility Functions', () => {

    describe('formatCurrency', () => {
        it('should format numbers to BRL currency', () => {
            const formatted = formatCurrency(1234.56);
            expect(formatted).toContain('R$');
            // Relaxed check for decimal separator to be robust across locales if needed, 
            // but usually BRL is strict.
            expect(formatted).toMatch(/1\.234,56/);
        });

        it('should handle zero', () => {
            const formatted = formatCurrency(0);
            expect(formatted).toContain('0,00');
        });

        it('should handle negative numbers', () => {
            const formatted = formatCurrency(-50);
            expect(formatted).toContain('-');
            expect(formatted).toContain('50,00');
        });
    });

    describe('formatDate', () => {
        it('should format ISO date string to DD/MM/YYYY', () => {
            // Use NOON on the date to avoid timezone rollback issues
            const result = formatDate('2023-10-05T12:00:00Z');
            expect(result).toBe('05/10/2023');
        });
    });

    describe('getBankDetails', () => {
        it('should return Nubank details', () => {
            const details = getBankDetails('Conta Nubank');
            expect(details.color).toBe('#820ad1');
        });

        it('should return default details for unknown bank', () => {
            const details = getBankDetails('Banco Desconhecido');
            expect(details.color).toBe('#1e293b');
        });
    });

    describe('getMonthName', () => {
        it('should return correct month name', () => {
            // Use NOON to avoid timezone rolling back to previous month/year
            expect(getMonthName('2023-01-01T12:00:00')).toBe('Jan');
            expect(getMonthName('2023-12-01T12:00:00')).toBe('Dez');
        })
    })
});
