
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { LegalDocument } from '@/app/models/LegalDocument';

// Minimal Mongoose connection helper for this route
async function connectMongoose() {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI missing");
    }
    await mongoose.connect(process.env.MONGODB_URI, {
        dbName: 'financeApp'
    });
}

// Update Terms (Admin Only - simplified logic)
export async function POST(request: Request) {
    try {
        const { content, title, version, secret } = await request.json();

        await connectMongoose();

        await LegalDocument.findOneAndUpdate(
            { slug: 'terms-of-use' },
            {
                content,
                title: title || "Termos de Uso",
                version: version || new Date().toISOString(),
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, message: "Terms updated" });
    } catch (error) {
        console.error("Error updating terms:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        await connectMongoose();

        console.log("Mongoose connected");
        console.log("Looking for collection:", LegalDocument.collection.name);

        const count = await LegalDocument.countDocuments();
        console.log("Total docs in collection:", count);

        const doc = await LegalDocument.findOne({ slug: 'terms-of-use' });
        console.log("Doc found:", doc ? "YES" : "NO");

        if (!doc) {
            return NextResponse.json({
                error: "Not Found",
                debug: {
                    collection: LegalDocument.collection.name,
                    count
                }
            }, { status: 404 });
        }

        return NextResponse.json(doc);
    } catch (error) {
        console.error("Error fetching terms:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
