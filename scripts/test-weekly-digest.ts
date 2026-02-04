import dotenv from 'dotenv';
import { ObjectId } from "mongodb";

dotenv.config();

async function runTest() {
    console.log("=== Testing Weekly Digest Email ===");

    const { getMongoClient } = await import("../src/db/connectionDb");
    const { NotificationService } = await import("../src/services/NotificationService");

    const client = await getMongoClient();
    await client.connect();
    const db = client.db('financeApp');

    const targetEmail = "joaovictorpfr@gmail.com";
    const user = await db.collection('users').findOne({ email: targetEmail });

    if (!user) {
        console.error(`User ${targetEmail} not found`);
        process.exit(1);
    }

    const service = new NotificationService();
    console.log(`Sending Weekly Digest to ${targetEmail}...`);

    // Note: This relies on InsightService generating data. 
    // If user has no transaction history, it might show empty/zeros, which is fine for template testing.
    await service.sendWeeklyDigest(user._id.toString());

    console.log("Done. Check your email!");
    process.exit(0);
}

runTest().catch(console.error);
