import dotenv from 'dotenv';
import { ObjectId } from "mongodb";

// 1. Load Env Vars FIRST
dotenv.config();

async function runTest() {
    console.log("=== Testing Upsell Email ===");

    // 2. Dynamic Import
    const { getMongoClient } = await import("../src/db/connectionDb");
    const { NotificationService } = await import("../src/services/NotificationService");

    // 3. Connect DB
    const client = await getMongoClient();
    await client.connect();
    const db = client.db('financeApp');

    // Target Email
    const targetEmail = "joaovictorpfr@gmail.com"; // CHANGE THIS IF NEEDED

    const user = await db.collection('users').findOne({ email: targetEmail });

    if (!user) {
        console.error(`User with email ${targetEmail} not found.`);
        process.exit(1);
    }

    console.log(`Found User: ${user.name} (${user._id})`);

    // 4. Clear previous Upsell notifications to force send
    console.log("Clearing 'upsell' notification history for this user...");
    await db.collection('notifications').deleteMany({
        userId: user._id,
        insightId: { $regex: /^upsell-/ }
    });

    // 5. Run Service
    console.log("Sending Upsell Email (PRO)...");
    const service = new NotificationService();
    await service.sendUpsellEmail(user._id.toString(), 'PRO');

    console.log("Done. Check your email!");
    process.exit(0);
}

runTest().catch(console.error);
