import { getMongoClient } from '@/db/connectionDb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server'

export async function POST(request: Request){
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required", status: 400 })
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { tutorialGuide: true } }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: "User not found", status: 404 })
        }

        return NextResponse.json({ message: "Tutorial status updated successfully", status: 200 })
    } catch (error) {
        console.error("Error updating tutorial status:", error);
        return NextResponse.json({ error: `Internal server error: ${error}`, status: 500 })
    }
}