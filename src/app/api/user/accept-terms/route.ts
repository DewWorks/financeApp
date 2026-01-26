
import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID Missing" }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    terms: {
                        accepted: true,
                        acceptedAt: new Date(),
                        ip: ip,
                        userAgent: userAgent
                    }
                }
            }
        );

        return NextResponse.json({ success: true, message: "Terms accepted" });

    } catch (error) {
        console.error("Error accepting terms:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
