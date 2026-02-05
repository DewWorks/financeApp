// Run with: node scripts/backup.js
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'financeApp';
const COLLECTIONS = ['users', 'transactions', 'auditlogs', 'plans'];

async function backup() {
    if (!MONGODB_URI) {
        console.error("❌ MONGODB_URI missing in .env.local");
        process.exit(1);
    }

    // Rotation Strategy: Keep only "Latest" and "Previous" to save space.
    const backupBaseDir = path.join(__dirname, '../backups');
    const latestDir = path.join(backupBaseDir, 'latest');
    const previousDir = path.join(backupBaseDir, 'previous');

    // Ensure folders exist
    if (!fs.existsSync(latestDir)) fs.mkdirSync(latestDir, { recursive: true });
    if (!fs.existsSync(previousDir)) fs.mkdirSync(previousDir, { recursive: true });

    // 1. Move current 'latest' to 'previous' (cleaning old previous)
    // We simply try to rename the folder or copy files. Simpler: Clear previous, move latest files to previous.
    // Actually, fs.renameSync is atomic and fast.

    // Logic: Delete 'previous', Rename 'latest' -> 'previous', Create new 'latest'
    // But 'latest' might not exist on first run.
    if (fs.existsSync(previousDir)) {
        fs.rmSync(previousDir, { recursive: true, force: true });
    }
    if (fs.existsSync(latestDir)) {
        fs.renameSync(latestDir, previousDir);
    }
    fs.mkdirSync(latestDir); // Re-create latest

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log(`✅ Connected. Backing up to: ${latestDir}`);
        const db = client.db(DB_NAME);

        for (const colName of COLLECTIONS) {
            console.log(`   Exporting ${colName}...`);
            const data = await db.collection(colName).find({}).toArray();
            fs.writeFileSync(
                path.join(latestDir, `${colName}.json`),
                JSON.stringify(data, null, 2)
            );
        }

        console.log("✅ Backup completed. 'latest' updated, old 'latest' moved to 'previous'.");

    } catch (error) {
        console.error("❌ Backup failed:", error);
    } finally {
        await client.close();
    }
}

backup();
