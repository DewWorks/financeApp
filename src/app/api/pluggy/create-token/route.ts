import { NextRequest, NextResponse } from "next/server";
import { getPluggyClient } from "@/lib/pluggy";

export async function POST(req: NextRequest) {
    try {
        const client = getPluggyClient();

        // Em produção, isso deve ser dinâmico para cada usuário
        // O webhook URL é onde a Pluggy vai notificar sobre novos dados
        // Para teste local (localhost), a Pluggy não consegue chamar seu webhook
        // Você precisará usar ferramentos como ngrok ou apenas testar o fluxo de conexão sem webhook por enquanto

        const data = await client.createConnectToken(undefined, {
            webhookUrl: process.env.PLUGGY_WEBHOOK_URL,
            clientUserId: "user-id-placeholder", // Substituir pelo ID real
        });

        return NextResponse.json({ accessToken: data.accessToken });
    } catch (error: any) {
        console.error("Erro ao criar connect token:", error);
        return NextResponse.json(
            { error: "Erro ao criar token de conexão", details: error.message },
            { status: 500 }
        );
    }
}
