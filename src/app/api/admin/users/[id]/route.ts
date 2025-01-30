import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@/db/connectionDb";
import { IUser } from "@/interfaces/IUser";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const userId = resolvedParams.id;

        // Verifica se o ID é válido
        if (!ObjectId.isValid(userId)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Busca o usuário pelo ID
        const user = await db.collection<IUser>("users").findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Remove informações sensíveis antes de retornar
        const { ...userData } = user;

        return NextResponse.json(userData);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
