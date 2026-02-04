import dotenv from 'dotenv';
import { ObjectId } from "mongodb";

dotenv.config();

async function runTest() {
    console.log("=== Testing Inactivity Reminder Email ===");

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
    console.log(`Sending Inactivity Reminder to ${targetEmail}...`);
    await service.sendInactivityReminder(user._id.toString());

    console.log("Done. Check your email!");
    process.exit(0);
}

runTest().catch(console.error);
