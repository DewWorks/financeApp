import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

        const subscription = await request.json();
        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Salvar ou atualizar assinatura (evitando duplicação para a mesma URI de endpoint)
        await db.collection("push_subscriptions").updateOne(
            { 
                userId: new ObjectId(userId), 
                "subscription.endpoint": subscription.endpoint 
            },
            { 
                $set: { 
                    subscription: subscription,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message: "Inscrição de notificações salva com sucesso!" });
    } catch (error) {
        console.error("[Push Subscribe API] Error:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
