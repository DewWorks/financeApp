import dotenv from 'dotenv';
import { ObjectId } from "mongodb";

// 1. Load Env Vars FIRST
dotenv.config();

async function runTest() {
    console.log("=== Testing Upsell Email (MAX PLAN) ===");

    // 2. Dynamic Import
    const { getMongoClient } = await import("../src/db/connectionDb");
    const { NotificationService } = await import("../src/services/NotificationService");

    // 3. Connect DB
    const client = await getMongoClient();
    await client.connect();
    const db = client.db('financeApp');

    // Target Email (User preference)
    const targetEmail = "joaovictorpfr@gmail.com";

    const user = await db.collection('users').findOne({ email: targetEmail });

    if (!user) {
        console.error(`User with email ${targetEmail} not found. Please ensure this user exists in your database.`);
        process.exit(1);
    }

    console.log(`Found User: ${user.name} (${user._id})`);

    // 4. Clear previous 'upsell-max' notifications to force send
    console.log("Clearing 'upsell-max' notification history...");
    await db.collection('notifications').deleteMany({
        userId: user._id,
        insightId: "upsell-max"
    });

    // 5. Run Service with MAX
    console.log("Sending Upsell Email (MAX)...");
    const service = new NotificationService();

    // Simulate user clicking on a 'MAX' feature (like Bank Sync or Deep AI)
    await service.sendUpsellEmail(user._id.toString(), 'MAX');

    console.log("Done. Check your email! It should mention AI and Bank Sync.");
    process.exit(0);
}

runTest().catch(console.error);
