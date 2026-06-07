import { NextResponse } from "next/server";
import { FinanceAgentService } from "@/services/FinanceAgentService";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const apiKey = searchParams.get("key");

        if (!apiKey) {
            return NextResponse.json({ error: "Chave de acesso requerida." }, { status: 401 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        let user = null;
        try {
            user = await db.collection("users").findOne({ _id: new ObjectId(apiKey) });
        } catch {
            // Chave não é um ObjectId válido
        }

        if (!user) {
            return NextResponse.json({ error: "Chave de acesso inválida." }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const { text } = body;

        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Texto da transação é requerido." }, { status: 400 });
        }

        const agent = new FinanceAgentService();
        const reply = await agent.processMessage(text, user._id.toString());

        return NextResponse.json({ success: true, reply });
    } catch (error: any) {
        console.error("[Quick Add API] Error:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
