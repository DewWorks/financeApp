// @ts-ignore
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generates a new MFA Secret and its OTPauth URL.
 * @param userEmail The user's email to display in the Authenticator App.
 * @returns Object containing the secret and the otpauth URL.
 */
export function generateMfaSecret(userEmail: string) {
    const secret = speakeasy.generateSecret({
        length: 20,
        name: `FinanceApp (${userEmail})`,
        issuer: 'FinanceApp'
    });

    // safe because we generated it
    return {
        secret: secret.base32,
        otpauth: secret.otpauth_url!
    };
}

/**
 * Generates a Data URL (base64 image) for the QR Code.
 * @param otpauth The otpauth URL.
 */
export async function generateQrCode(otpauth: string) {
    return await QRCode.toDataURL(otpauth);
}

/**
 * Verifies a token against a secret.
 * @param token The 6-digit code provided by user.
 * @param secret The user's stored secret (base32).
 */
export function verifyMfaToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1 // Allow 1 step margin (30s before/after)
    });
}
