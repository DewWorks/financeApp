import crypto from 'crypto';

// Key must be 32 bytes (256 bits) for AES-256
// In production, this MUST be set via environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Default for dev only
const IV_LENGTH = 16; // AES block size

export const CryptoService = {
    encrypt(text: string): string {
        if (!text) return text;
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            return iv.toString('hex') + ':' + encrypted.toString('hex');
        } catch (error) {
            console.error("Encryption failed:", error);
            return text; // Fallback: return original (or throw)
        }
    },

    decrypt(text: string): string {
        if (!text || !text.includes(':')) return text;
        try {
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift()!, 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (error) {
            console.error("Decryption failed:", error);
            return text; // Fallback
        }
    }
};
