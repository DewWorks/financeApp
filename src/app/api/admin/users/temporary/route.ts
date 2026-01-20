import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

/**
 * @swagger
 * /api/admin/users/temporary:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List temporary users
 *     description: Retrieves all temporary users (WhatsApp users). Requires Admin ID.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin User ID (for authentication)
 *     responses:
 *       200:
 *         description: List of temporary users
 *       400:
 *         description: Missing or invalid Admin ID
 *       403:
 *         description: Forbidden (Not an admin)
 *       500:
 *         description: Internal server error
 */
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
