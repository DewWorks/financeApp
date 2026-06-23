import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { getUserIdFromToken } from "@/app/functions/getUserId";
import { getOrCreateCustomer, createSubscription } from "@/lib/asaas";

export async function POST(req: Request) {
    try {
        const userId = await getUserIdFromToken();
        const { priceId } = await req.json(); // "PRO" ou "MAX"

        if (!priceId) {
            return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");
        const user = await db.collection("users").findOne({ _id: userId });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let value = 0;
        let description = "";

        if (priceId === 'PRO') {
            value = 19.90;
            description = "Plano PRO Mensal";
        } else if (priceId === 'MAX') {
            value = 49.90;
            description = "Plano MAX Mensal";
        } else {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        // 1. Criar ou buscar cliente no Asaas
        const asaasCustomer = await getOrCreateCustomer(user.name, user.email, user.cpf);
        
        // 2. Criar a assinatura no Asaas
        const subscriptionResult = await createSubscription(
            asaasCustomer.id,
            value,
            description,
            'MONTHLY'
        );

        // 3. Atualizar o usuário no DB com os novos IDs e status pending (TRIAL ou aguardando pagamento)
        await db.collection("users").updateOne(
            { _id: userId },
            {
                $set: {
                    "subscription.providerId": asaasCustomer.id,
                    "subscription.subscriptionId": subscriptionResult.subscriptionId,
                    // Não alteramos o 'plan' oficial aqui, pois só vira PRO quando pagar. Deixamos o webhook resolver.
                }
            }
        );

        // 4. Retornar a URL de pagamento da fatura
        if (subscriptionResult.invoiceUrl) {
            return NextResponse.json({ url: subscriptionResult.invoiceUrl });
        } else {
            return NextResponse.json({ error: "Não foi possível gerar o link de pagamento." }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Payment Checkout Error:", error.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
