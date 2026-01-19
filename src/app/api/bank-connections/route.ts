import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { getPluggyClient } from "@/lib/pluggy";
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const logDebug = (message: string) => {
    try {
        const logPath = path.join(process.cwd(), 'debug_bank_conn.log');
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
        // failed to log
    }
}

async function getUserId() {
    const token = (await cookies()).get('auth_token')?.value
    logDebug(`Checking Token: ${token ? 'Token Found' : 'No Token'}`);
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        logDebug(`Token Verified. UserId: ${decoded.userId}`);
        return new ObjectId(decoded.userId)
    } catch (err) {
        logDebug(`Token Verification Failed: ${err}`);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        logDebug("Received POST request to /api/bank-connections");

        const userId = await getUserId();

        const client = await getMongoClient();
        const db = client.db("financeApp");

        if (!userId) {
            logDebug("Unauthorized - No User ID");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        logDebug(`Request Body: ${JSON.stringify(body)}`);

        const { item } = body;

        if (!item || !item.id) {
            logDebug("Invalid Body Data");
            return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
        }

        // Buscar detalhes das contas do item na Pluggy
        logDebug(`Fetching Pluggy Accounts for Item: ${item.id}`);
        const pluggyClient = getPluggyClient();
        const accountsResponse = await pluggyClient.fetchAccounts(item.id);
        const accounts = accountsResponse.results;
        logDebug(`Accounts Found via SDK: ${accounts.length}`);

        // Salvar ou atualizar conexão
        const updateData = {
            userId: userId,
            provider: 'pluggy',
            itemId: item.id,
            status: item.status,
            lastSyncAt: new Date(),
            accounts: accounts.map((acc: any) => ({
                accountId: acc.id,
                name: acc.name,
                number: acc.number,
                balance: acc.balance,
                currency: acc.currencyCode,
                type: acc.type,
                subtype: acc.subtype
            })),
            updatedAt: new Date()
        };

        const result = await db.collection('bankConnections').updateOne(
            { itemId: item.id },
            {
                $set: updateData,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );

        logDebug(`DB Update Result: ${JSON.stringify(result)}`);

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        logDebug(`CRITICAL ERROR in POST: ${error.message} \n ${error.stack}`);
        console.error("Erro ao salvar conexão bancária:", error);
        return NextResponse.json(
            { error: "Erro ao salvar conexão", details: error.message },
            { status: 500 }
        );
    }
}
// Keep POST as is... adding GET below

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserId();
        const client = await getMongoClient();
        const db = client.db("financeApp");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const connections = await db.collection('bankConnections').find({ userId: userId }).toArray();

        return NextResponse.json(connections);
    } catch (error: any) {
        console.error("Erro ao buscar conexões:", error);
        return NextResponse.json({ error: "Erro ao buscar conexões" }, { status: 500 });
    }

}

export async function DELETE(req: NextRequest) {
    try {
        const userId = await getUserId();
        const client = await getMongoClient();
        const db = client.db("financeApp");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get('itemId');

        if (!itemId) {
            return NextResponse.json({ error: "ItemId is required" }, { status: 400 });
        }

        logDebug(`Deleting connection: ${itemId} for user: ${userId}`);

        const result = await db.collection('bankConnections').deleteOne({
            itemId: itemId,
            userId: userId // Ensure user owns the connection
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Conexão não encontrada ou não pertence ao usuário" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Erro ao deletar conexão:", error);
        return NextResponse.json({ error: "Erro ao deletar conexão" }, { status: 500 });
    }
}
