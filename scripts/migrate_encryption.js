// Run with: node scripts/migrate_encryption.js
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'financeApp';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must match .env
const IV_LENGTH = 16;

if (!process.env.ENCRYPTION_KEY) {
    console.warn("⚠️ WARNING: Using default dev logic key. Ensure ENCRYPTION_KEY is set in .env.local for production!");
}

// Re-implementing logic here to avoid TS/Import issues in standalone script
function encrypt(text) {
    if (!text) return text;
    try {
        // Idempotency: sensitive check to avoid double encryption
        // If it already looks like "hex:hex", skip (simplified check)
        if (text.includes(':') && text.split(':')[0].length === 32) return text;

        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
        console.error("Encrypt error:", e);
        return text;
    }
}

async function migrate() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        console.log("🔒 Starting Encryption Migration...");
        const db = client.db(DB_NAME);
        const users = db.collection('users');

        let count = 0;
        const cursor = users.find({});

        for await (const user of cursor) {
            let updates = {};

            if (user.cpf && !user.cpf.includes(':')) {
                updates.cpf = encrypt(user.cpf);
            }
            if (user.address && !user.address.includes(':')) {
                updates.address = encrypt(user.address);
            }

            if (Object.keys(updates).length > 0) {
                await users.updateOne({ _id: user._id }, { $set: updates });
                count++;
                process.stdout.write(`\rPwnd (Encrypted): ${count} users...`);
            }
        }

        console.log(`\n✅ Migration Complete. ${count} users updated.`);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

migrate();
