import dotenv from 'dotenv';
import { ObjectId } from "mongodb";

// 1. Load Env Vars FIRST
dotenv.config();

async function runTest() {
    console.log("=== Testing Notification Service ===");

    // 2. Dynamic Import ensures Env Vars are loaded before this code runs
    // This prevents "Invalid/Missing environment variable" error from connectionDb.ts
    const { getMongoClient } = await import("../src/db/connectionDb");
    const { NotificationService } = await import("../src/services/NotificationService");

    // 1. Manually add a fake 'User' or pick an existing one if you know the ID.
    // For safety, let's look for a user with email.
    const client = await getMongoClient();
    await client.connect();
    const db = client.db('financeApp');

    // Replace this email with the one you want to test!
    const targetEmail = "joaovictorpfr@gmail.com";

    const user = await db.collection('users').findOne({ email: targetEmail });

    if (!user) {
        console.error(`User with email ${targetEmail} not found. Please edit the script with a valid user email.`);
        process.exit(1);
    }

    console.log(`Found User: ${user.name} (${user._id})`);

    // 2. Clear previous notifications for this user (to bypass Throttling for test)
    console.log("Clearing throttle history for this user...");
    await db.collection('notifications').deleteMany({ userId: user._id });

    // 3. Inject a Fake High-Spend Insight?
    console.log("simulating a huge expense to trigger anomaly...");
    const fakeTx = {
        userId: user._id,
        type: 'expense',
        description: 'TESTE ANOMALIA ALERT',
        amount: 50000,
        tag: 'Alimentação', // Assuming average is much lower
        date: new Date(),
        createdAt: new Date()
    };

    const insertRes = await db.collection('transactions').insertOne(fakeTx);
    console.log("Inserted fake transaction:", insertRes.insertedId);

    // 4. Run Service
    console.log("Running checkAndSendAlerts...");
    const service = new NotificationService();
    await service.checkAndSendAlerts(user._id.toString());

    // 5. Cleanup
    console.log("Cleaning up fake transaction...");
    await db.collection('transactions').deleteOne({ _id: insertRes.insertedId });

    console.log("Done. Check your email!");
    process.exit(0);
}

runTest().catch(console.error);
