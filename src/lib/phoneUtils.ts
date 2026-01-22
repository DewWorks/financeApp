import { parsePhoneNumber, isValidPhoneNumber as isValidLibPhone, PhoneNumber } from 'libphonenumber-js'

export const DEFAULT_COUNTRY = 'BR';

/**
 * Formats a phone number to E.164 standard (e.g., +5511999999999).
 * Handles inputs with or without country code.
 * @param phone The input phone string.
 * @returns The formatted E.164 string or null if invalid.
 */
export function formatToE164(phone: string): string | null {
    if (!phone) return null;
    try {
        // Tenta parsear. Se não tiver DDI, assume BR.
        const phoneNumber = parsePhoneNumber(phone, DEFAULT_COUNTRY);
        if (phoneNumber && phoneNumber.isValid()) {
            return phoneNumber.number; // Retorna formato E.164 (+55...)
        }
    } catch (error) {
        // Se falhar o parse padrão, tenta adicionar + manualmente se parecer faltar
        // mas o parsePhoneNumber já lida bem com '11999...' passando BR
    }
    return null;
}

/**
 * Strict validation of phone number.
 * @param phone The input phone string.
 * @returns true if valid, false otherwise.
 */
export function isValidPhone(phone: string): boolean {
    if (!phone) return false;
    return isValidLibPhone(phone, DEFAULT_COUNTRY);
}

export type PhoneValidationError = 'EMPTY' | 'INVALID_COUNTRY' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_LENGTH' | 'NOT_A_NUMBER';

/**
 * Validates phone and returns specific error if invalid.
 */
export function validatePhoneDetails(phone: string): { isValid: boolean, error?: PhoneValidationError } {
    if (!phone) return { isValid: false, error: 'EMPTY' };

    // Check basic char validity
    if (!/[0-9]/.test(phone)) return { isValid: false, error: 'NOT_A_NUMBER' };

    try {
        // Se o usuário digitou algo como +55 ..., o parsePhoneNumber entende como BR (ou o país do DDI)
        // Se ele digitou (63)..., entende como BR pelo default country.
        const phoneNumber = parsePhoneNumber(phone, DEFAULT_COUNTRY);

        if (phoneNumber && phoneNumber.isValid()) {
            return { isValid: true };
        } else {
            return { isValid: false, error: 'INVALID_LENGTH' }; // Generic invalid
        }
    } catch (error) {
        // Strict parse failed. Let's try to be permissive with the digits.
        const clean = phone.replace(/\D/g, '');
        // If it has enough digits to be a phone number (10 to 15), we consider it possibly valid 
        // and let the backend decide if it exists.
        // But we want to avoid "123" passing.
        if (clean.length >= 10 && clean.length <= 15) {
            return { isValid: true };
        }

        // Parse error usually means too short or garbage
        if (error instanceof Error) {
            if (error.message.includes('TOO_SHORT')) return { isValid: false, error: 'TOO_SHORT' };
            if (error.message.includes('TOO_LONG')) return { isValid: false, error: 'TOO_LONG' };
            if (error.message.includes('INVALID_COUNTRY')) return { isValid: false, error: 'INVALID_COUNTRY' };
        }
        return { isValid: false, error: 'INVALID_LENGTH' };
    }
}

/**
 * Returns variations of the phone number to match against the database.
 * Use this when searching for a user by phone (Login/Auth).
 * strategies:
 * 1. E.164 (Standard storage): +5563999999999
 * 2. Raw digits: 5563999999999
 * 3. Local format (no country code): 63999999999
 * 4. Input literal: (whatever user typed, stripped of non-digits)
 */
export function getPhoneQueryVariations(phone: string): string[] {
    const variations = new Set<string>();
    const cleanInput = phone.replace(/\D/g, '');

    // Add exactly what was cleaned from input
    if (cleanInput) variations.add(cleanInput);

    // Add raw input (trimmed) just in case DB has unformatted legacy data
    if (phone.trim()) variations.add(phone.trim());

    try {
        const phoneNumber = parsePhoneNumber(phone, DEFAULT_COUNTRY);
        if (phoneNumber) {
            // 1. E.164 Standard (+55...)
            variations.add(phoneNumber.number);

            // 2. National format digits (e.g. 63999999999)
            // phoneNumber.nationalNumber retorna o numero sem DDI (ex: 63984207313)
            variations.add(phoneNumber.nationalNumber as string);

            // 3. Full digits without plus (e.g. 5563999999999)
            variations.add(phoneNumber.number.replace('+', ''));
        }
    } catch (e) {
        // Se falhar o parse, ficamos apenas com o cleanInput
    }

    // Fallbacks para compatibilidade com dados legados ou cadastros manuais
    // Se o input parece ser apenas DDD+Numero (11 digitos), tenta adicionar 55 e +55
    if (cleanInput.length === 11) {
        variations.add(`55${cleanInput}`);
        variations.add(`+55${cleanInput}`);
    }
    // Se tem 13 digitos (55 + 11), garante o com e sem +
    if (cleanInput.length === 13 && cleanInput.startsWith('55')) {
        variations.add(`+${cleanInput}`);
        variations.add(cleanInput);
    }

    return Array.from(variations);
}

/**
 * Formats a phone for display (e.g. (63) 98420-7313)
 */
export function formatPhoneDisplay(phone: string): string {
    try {
        const phoneNumber = parsePhoneNumber(phone, DEFAULT_COUNTRY);
        if (phoneNumber) {
            return phoneNumber.formatNational();
        }
    } catch (e) {
        return phone;
    }
    return phone;
}
