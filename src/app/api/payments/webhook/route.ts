import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('asaas-access-token');
        const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

        // Validar Token de Webhook (Segurança)
        if (expectedToken && signature !== expectedToken) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const body = await req.json();
        const { event, payment } = body;

        // O Asaas envia webhook do PAYMENT vinculado à assinatura
        if (!payment || !payment.subscription) {
            return NextResponse.json({ received: true }); // Ignora eventos que não são de assinatura
        }

        const subscriptionId = payment.subscription;
        const customerId = payment.customer;
        
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const user = await db.collection("users").findOne({
            "subscription.subscriptionId": subscriptionId
        });

        if (!user) {
            console.error(`User not found for Asaas Subscription ID: ${subscriptionId}`);
            return NextResponse.json({ received: true });
        }

        let updateData: any = {};

        switch (event) {
            case 'PAYMENT_RECEIVED':
            case 'PAYMENT_CONFIRMED':
                // Pagamento confirmado. Determinar plano pelo valor.
                let plan = 'PRO';
                if (payment.value > 20) {
                    plan = 'MAX';
                }
                
                updateData = {
                    "subscription.status": "ACTIVE",
                    "subscription.plan": plan,
                    "subscription.expiresAt": new Date(payment.dueDate).setMonth(new Date(payment.dueDate).getMonth() + 1)
                };
                break;
            
            case 'PAYMENT_OVERDUE':
                updateData = { "subscription.status": "PAST_DUE" };
                break;

            case 'PAYMENT_DELETED':
            case 'PAYMENT_REFUNDED':
                // Se o pagamento for cancelado/estornado, volta pra FREE
                updateData = { 
                    "subscription.status": "CANCELED",
                    "subscription.plan": "FREE"
                };
                break;
        }

        if (Object.keys(updateData).length > 0) {
            await db.collection("users").updateOne(
                { _id: user._id },
                { $set: updateData }
            );
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error("Asaas Webhook Error:", error);
        return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
    }
}
