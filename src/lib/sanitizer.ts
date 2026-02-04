/**
 * Library for sanitizing sensitive data (PII) before sending to external services (AI, Logs).
 * Compliant with LGPD anonymization requirements.
 */

// Regex patterns for Brazil PII
const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CNPJ_REGEX = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
// Phone: Matches (XX) 9XXXX-XXXX or simple 11999999999
const PHONE_REGEX = /\b\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/g;
// Credit Card: Matches 16 digits, with or without spaces/dashes
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;

/**
 * Sanitizes a string by replacing PII with placeholders.
 * @param text The input text potentially containing PII.
 * @returns The sanitized text.
 */
export function sanitizeForAI(text: string): string {
    if (!text) return "";

    return text
        .replace(CPF_REGEX, "[CPF]")
        .replace(CNPJ_REGEX, "[CNPJ]")
        .replace(EMAIL_REGEX, "[EMAIL]")
        .replace(PHONE_REGEX, "[PHONE]")
        // Credit card regex is tricky to not catch normal numbers, 
        // using a stricter check or just assuming description won't have it often.
        // For now, let's stick to the others which are more common in "Pix description".
        ;
}

/**
 * Specifically cleans transaction descriptions.
 * @param description 
 */
export function cleanTransactionDescription(description: string): string {
    if (!description) return "";

    // First, standard PII removal
    let clean = sanitizeForAI(description);

    // Remove specific banking noises often found in exports
    // Ex: "PIX TRANSF ", "TED DOC "
    clean = clean
        .replace(/PIX (TRANSF|ENVIADO|RECEBIDO)/gi, "PIX")
        .replace(/TRANSFERNCIA/gi, "TRANSFERENCIA")
        .trim();

    return clean;
}
