import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing admin ID" }, { status: 400 });
        }

        let adminId: ObjectId;
        try {
            adminId = new ObjectId(id);
        } catch (err) {
            return NextResponse.json({ error: err }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Buscar usuário admin pelo ID
        const adminUser = await db.collection("users").findOne({ _id: adminId });

        if (!adminUser || !adminUser.admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Buscar todos os usuários temporários com email padrão
        const temporarios = await db
            .collection("users")
            .find({
                isTemporary: true,
                email: /@whatsapp\.temp$/,
            })
            .project({ password: 0 })
            .toArray();

        return NextResponse.json({ temporarios }, { status: 200 });
    } catch (error) {
        console.error("Erro na rota de usuários temporários:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
