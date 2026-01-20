import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import bcrypt from "bcryptjs";
import { IUser } from "@/interfaces/IUser";
import { sendEmail } from "@/app/functions/emails/sendEmail";

/**
 * @swagger
 * /api/auth/verify-whatsapp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify WhatsApp code
 *     description: Verifies user registration/access via WhatsApp code code.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - verificationCode
 *               - cel
 *             properties:
 *               password:
 *                 type: string
 *               verificationCode:
 *                 type: string
 *               cel:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User verified and updated
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Invalid verification code
 *       404:
 *         description: User not found
 *       410:
 *         description: Verification code expired
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
    try {
        const { password, verificationCode, email, cel } = await request.json();

        if (!password || !verificationCode || !cel) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        const normalizedPhone = cel.replace(/\D/g, "");
        const user = await db.collection("users").findOne({
            "verification.code": verificationCode,
            cel: { $in: [normalizedPhone] }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const verification = user.verification;

        if (!verification || verification.code !== verificationCode) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
        }

        const now = new Date();
        if (!verification.expiresAt || new Date(verification.expiresAt) < now) {
            return NextResponse.json({ error: "Verification code expired" }, { status: 410 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const update: Partial<IUser> = {
            password: hashedPassword,
            updatedAt: now,
            verification: {
                ...user.verification,
                verified: true
            }
        };

        if (email) {
            update.email = email;
        }

        const updateUserVerify: Partial<IUser> = {
            password: hashedPassword,
            updatedAt: now,
            verification: {
                verified: true,
            },
            ...(email && { email }),
        };

        await db.collection("users").updateOne(
            { _id: user._id },
            {
                $set: updateUserVerify
            }
        );

        // Enviar e-mail de boas-vindas
        await sendEmail({
            to: email || user.email,
            subject: "Bem-vindo ao FinancePro!",
            htmlContent: `
    <h2 style="color: #0085FF;">Cadastro confirmado com sucesso!</h2>
    <p style="font-size: 16px;">
      Olá, tudo certo? Seu cadastro no <strong>FinancePro</strong> foi confirmado com sucesso.
    </p>
    <p style="font-size: 16px;">
      A partir de agora você pode organizar suas finanças com facilidade, acompanhar seus gastos e planejar seus ganhos.
    </p>
    <br/>
    <a href="https://finance-pro-mu.vercel.app" 
      style="display: inline-block; padding: 12px 24px; background-color: #0085FF; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
      Acessar FinancePro
    </a>
    <br/><br/>
    <p style="font-size: 14px; color: #888;">Equipe FinancePro</p>
  `
        });

        return NextResponse.json({ message: "User verified and updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
