
import { randomInt } from "crypto"
import { getMongoClient } from "@/db/connectionDb"
import { sendEmail } from "@/app/functions/emails/sendEmail"
import twilio from "twilio"
import { ObjectId } from "mongodb"
import { verifyMfaToken } from "./mfa"

// Initialize Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioNumber = process.env.TWILIO_PHONE_NUMBER
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null

export const MfaService = {
    /**
     * Generates a numeric OTP (6 digits)
     */
    generateOtp(): string {
        return randomInt(100000, 1000000).toString()
    },

    /**
     * Sends OTP via selected channel
     */
    async sendOtp(userId: string, channel: 'email' | 'whatsapp'): Promise<boolean> {
        const clientDb = await getMongoClient()
        const db = clientDb.db("financeApp")
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

        if (!user) return false

        const code = this.generateOtp()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        // Save to DB
        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    verification: {
                        code,
                        type: 'mfa-login',
                        channels: [channel],
                        expiresAt,
                        verified: false
                    }
                }
            }
        )

        // Send
        if (channel === 'email' && user.email) {
            await sendEmail({
                to: user.email,
                subject: 'Seu código de verificação FinancePro',
                htmlContent: `
                    <div style="font-family: sans-serif;">
                        <h2>Código de Acesso</h2>
                        <p>Use este código para completar seu login:</p>
                        <h1 style="color: #2563eb; letter-spacing: 5px;">${code}</h1>
                        <p>Válido por 5 minutos.</p>
                    </div>
                `
            })
            return true
        }

        if (channel === 'whatsapp' && user.cel && client && twilioNumber) {
            try {
                // Determine phone number (use first one)
                let phone = user.cel[0]
                // Ensure E.164
                if (!phone.startsWith('+')) phone = `+${phone.replace(/\D/g, '')}`

                await client.messages.create({
                    body: `FinancePro: Seu código de acesso é ${code}. Válido por 5 minutos.`,
                    from: twilioNumber,
                    to: `whatsapp:${phone}`
                })
                return true
            } catch (error) {
                console.error("Twilio Send Error:", error)
                return false
            }
        }

        return false
    },

    /**
     * Verifies code (Handling both TOTP from App and DB OTP from Fallback)
     */
    async verifyLoginCode(userId: string, code: string): Promise<boolean> {
        const clientDb = await getMongoClient()
        const db = clientDb.db("financeApp")
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

        if (!user) return false

        // 1. Try TOTP (Time-based from App) if enabled
        if (user.mfaEnabled && user.mfaSecret) {
            const isTotpValid = verifyMfaToken(code, user.mfaSecret)
            if (isTotpValid) return true
        }

        // 2. Try OTP (Server-sent via Email/WhatsApp)
        // Check DB for active verification code
        if (user.verification && user.verification.type === 'mfa-login') {
            const now = new Date()
            if (
                user.verification.code === code &&
                user.verification.expiresAt > now &&
                !user.verification.verified // Optional: prevent reuse?
            ) {
                // Mark as verified (optional, or just burn after login)
                // For login, we usually just accept.
                // Let's clear it to prevent replay attacks
                await db.collection("users").updateOne(
                    { _id: new ObjectId(userId) },
                    { $unset: { verification: "" } }
                )
                return true
            }
        }

        return false
    }
}
