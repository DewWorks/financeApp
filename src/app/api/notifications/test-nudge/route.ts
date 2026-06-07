import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import webPush from "web-push";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configurar chaves VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidEmail = process.env.VAPID_EMAIL || "mailto:suporte@financepro.com";

if (vapidPublicKey && vapidPrivateKey) {
    webPush.setVapidDetails(
        vapidEmail,
        vapidPublicKey,
        vapidPrivateKey
    );
}

async function getUserIdFromToken() {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const customTitle = body.title || "Dica do Fin 🤖";
        const customMessage = body.message || "Olá! Que tal registrar seus gastos de hoje para manter seu orçamento atualizado? É rapidinho! 🚀";

        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Obter todas as assinaturas push do usuário
        const subscriptions = await db.collection("push_subscriptions").find({
            userId: new ObjectId(userId)
        }).toArray();

        if (subscriptions.length === 0) {
            return NextResponse.json({ 
                error: "Nenhuma assinatura de notificação ativa encontrada para este dispositivo. Ative as notificações no banner primeiro." 
            }, { status: 404 });
        }

        let sentCount = 0;
        let expiredCount = 0;

        const payload = JSON.stringify({
            title: customTitle,
            body: customMessage,
            url: "/?tab=goals" // Abrir na aba de desafios/metas ao clicar
        });

        for (const subDoc of subscriptions) {
            try {
                await webPush.sendNotification(subDoc.subscription, payload);
                sentCount++;
            } catch (err: any) {
                console.error("Failed to send push notification to endpoint:", subDoc.subscription.endpoint, err);
                // Limpeza automática se a inscrição expirou ou não existe mais
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await db.collection("push_subscriptions").deleteOne({ _id: subDoc._id });
                    expiredCount++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Nudge enviado! Sucesso: ${sentCount}, Expiradas/Removidas: ${expiredCount}`
        });

    } catch (error: any) {
        console.error("[Push Test-Nudge API] Error:", error);
        return NextResponse.json({ error: "Erro interno ao disparar notificação: " + error.message }, { status: 500 });
    }
}
