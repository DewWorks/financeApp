import { NextResponse } from "next/server";
import { getMongoClient } from "@/db/connectionDb";
import bcrypt from "bcryptjs";
import { IUser } from "@/interfaces/IUser";

export async function POST(request: Request) {
    try {
        const { password, verificationCode, email } = await request.json();

        if (!password || !verificationCode) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const client = await getMongoClient();
        const db = client.db("financeApp");

        // Buscar usuário por verification.code
        const user = await db.collection("users").findOne({ "verification.code": verificationCode });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const verification = user.verification;

        if (!verification || verification.code !== verificationCode) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
        }

        const now = new Date();
        if (!verification.expiresAt || new Date(verification.expiresAt) < now) {
            return NextResponse.json({ error: "Verification code expired" }, { status: 410 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const update: Partial<IUser> = {
            password: hashedPassword,
            updatedAt: now,
            verification: {
                ...user.verification,
                verified: true
            }
        };

        if (email) {
            update.email = email;
        }

        await db.collection("users").updateOne(
            { _id: user._id },
            {
                $set: update,
                $unset: {
                    "verification.code": "",
                    "verification.expiresAt": "",
                },
            }
        );

        return NextResponse.json({ message: "User verified and updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
