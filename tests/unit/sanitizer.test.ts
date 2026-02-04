import { describe, it, expect } from 'vitest';
import { sanitizeForAI, cleanTransactionDescription } from '../../src/lib/sanitizer';

describe('Sanitizer Service', () => {
    it('should mask CPFs', () => {
        const input = "Pix para 123.456.789-00 referente a aluguel";
        const expected = "Pix para [CPF] referente a aluguel";
        expect(sanitizeForAI(input)).toBe(expected);
    });

    it('should mask CPFs without formatting', () => {
        const input = "CPF 12345678900";
        const expected = "CPF [CPF]";
        expect(sanitizeForAI(input)).toBe(expected);
    });

    it('should mask Emails', () => {
        const input = "Contato joao.silva@gmail.com urgente";
        const expected = "Contato [EMAIL] urgente";
        expect(sanitizeForAI(input)).toBe(expected);
    });

    it('should mask Phone Numbers', () => {
        const input = "Zelle (11) 99999-9999";
        const expected = "Zelle [PHONE]";
        expect(sanitizeForAI(input)).toBe(expected);
    });

    it('should handle mixed PII', () => {
        const input = "Pagamento 123.456.789-00 email teste@teste.com";
        const expected = "Pagamento [CPF] email [EMAIL]";
        expect(sanitizeForAI(input)).toBe(expected);
    });

    it('should clean transaction noise', () => {
        const input = "PIX TRANSF enviada para Maria";
        const expected = "PIX enviada para Maria";
        expect(cleanTransactionDescription(input)).toBe(expected);
    });
});
