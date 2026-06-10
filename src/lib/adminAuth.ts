/**
 * adminAuth.ts — Server-side admin validation helper.
 *
 * Always validates against MongoDB — the JWT alone is NOT trusted
 * because the `admin` flag lives in the database, not the token payload.
 *
 * Usage:
 *   import { requireAdmin } from "@/lib/adminAuth";
 *   const { userId, error } = await requireAdmin(request);
 *   if (error) return error; // NextResponse with 401/403
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AdminAuthResult {
    userId: string;
    error: null;
}

interface AdminAuthError {
    userId: null;
    error: NextResponse;
}

export async function requireAdmin(): Promise<AdminAuthResult | AdminAuthError> {
    // 1. Read JWT from httpOnly cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
        return {
            userId: null,
            error: NextResponse.json({ error: "Unauthorized: no session" }, { status: 401 })
        };
    }

    // 2. Verify JWT signature — rejects tampered tokens
    let decoded: { userId: string };
    try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
        return {
            userId: null,
            error: NextResponse.json({ error: "Unauthorized: invalid token" }, { status: 401 })
        };
    }

    // 3. Verify admin flag from DB — not from the token payload
    //    This is the critical check: even if someone forges a token,
    //    the DB must have admin: true for that user.
    try {
        const client = await getMongoClient();
        const db = client.db("financeApp");

        const user = await db.collection("users").findOne(
            { _id: new ObjectId(decoded.userId) },
            { projection: { admin: 1 } }
        );

        if (!user) {
            return {
                userId: null,
                error: NextResponse.json({ error: "Forbidden: user not found" }, { status: 403 })
            };
        }

        if (user.admin !== true) {
            return {
                userId: null,
                error: NextResponse.json({ error: "Forbidden: not an admin" }, { status: 403 })
            };
        }

        return { userId: decoded.userId, error: null };

    } catch (e: any) {
        return {
            userId: null,
            error: NextResponse.json({ error: "Internal server error during auth" }, { status: 500 })
        };
    }
}
