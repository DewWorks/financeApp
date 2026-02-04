import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { ObjectId } from 'mongodb';
import { generateMfaSecret, generateQrCode } from '@/lib/mfa';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const userId = decoded.userId;

        const client = await getMongoClient();
        const db = client.db('financeApp');

        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Generate new secret
        const { secret, otpauth } = generateMfaSecret(user.email);
        const qrCode = await generateQrCode(otpauth);

        // Does NOT save to user yet. Secret must be verified first.
        // We return the secret (to verify next step) but ideally we should store it temporarily 
        // OR send encrypted in response to be passed back?
        // Better: Store in a temporary collection/cache or Encrypt and send to client to send back?
        // Simplest for now: Return secret to client, client sends back with code to confirm.
        // Risk: Client sees secret. But client *needs* secret to set up manually if QR fails. So it's fine.

        return NextResponse.json({ secret, qrCode });

    } catch (error) {
        console.error('MFA Setup Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
