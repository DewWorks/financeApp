import { NextResponse } from 'next/server';
import { getMongoClient } from '@/db/connectionDb';
import { CryptoService } from '@/lib/crypto';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        console.log("🔒 Starting Encryption Migration (API)...");
        const client = await getMongoClient();
        const db = client.db("financeApp");
        const usersCollection = db.collection('users');

        let count = 0;
        // Fetch all users using raw Mongo driver to avoid Mongoose hooks interfering during migration
        const users = await usersCollection.find({}).toArray();

        for (const user of users) {
            let updates: any = {};
            let modified = false;

            // Encrypt CPF if it exists and DOES NOT look encrypted (contains ':')
            if (user.cpf && typeof user.cpf === 'string' && !user.cpf.includes(':')) {
                updates.cpf = CryptoService.encrypt(user.cpf);
                modified = true;
            }

            // Encrypt Address
            if (user.address && typeof user.address === 'string' && !user.address.includes(':')) {
                updates.address = CryptoService.encrypt(user.address);
                modified = true;
            }

            if (modified) {
                await usersCollection.updateOne(
                    { _id: user._id },
                    { $set: updates }
                );
                count++;
            }
        }

        return NextResponse.json({
            message: 'Migration Complete',
            usersProcessed: users.length,
            usersUpdated: count
        });

    } catch (error) {
        console.error("Migration Failed:", error);
        return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
    }
}
