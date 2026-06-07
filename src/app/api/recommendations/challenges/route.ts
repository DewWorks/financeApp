import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { ChallengeService } from "@/services/ChallengeService";
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

export async function GET(request: Request) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        const stats = await ChallengeService.getUserSavingsROI(userId);

        const activeChallenges = await db
            .collection("recommendations")
            .find({
                userId: new ObjectId(userId),
                status: "ACTIVE",
            })
            .toArray();

        return NextResponse.json({
            stats,
            activeChallenges: activeChallenges.map(c => ({
                id: c._id.toString(),
                category: c.category,
                title: c.title,
                message: c.message,
                actionableStep: c.actionableStep,
                impactEstimate: c.impactEstimate,
                targetLimit: c.targetLimit,
                challengeEndDate: c.challengeEndDate,
            })),
        });
    } catch (error: any) {
        console.error("[Get Challenges API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { recommendationId, action } = body;

        if (!recommendationId || !action || !["accept", "dismiss"].includes(action)) {
            return NextResponse.json({ error: "recommendationId e action ('accept' ou 'dismiss') são obrigatórios." }, { status: 400 });
        }

        if (action === "accept") {
            const res = await ChallengeService.acceptChallenge(userId, recommendationId);
            return NextResponse.json(res);
        } else {
            const res = await ChallengeService.dismissChallenge(userId, recommendationId);
            return NextResponse.json(res);
        }
    } catch (error: any) {
        console.error("[Post Challenges API] Error:", error);
        return NextResponse.json({ error: error.message || "Falha ao processar o desafio." }, { status: 500 });
    }
}
