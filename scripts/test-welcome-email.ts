import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    console.log("=== Testing Welcome Email ===");

    const { getMongoClient } = await import("../src/db/connectionDb");
    const { NotificationService } = await import("../src/services/NotificationService");

    const targetEmail = "joaovictorpfr@gmail.com";
    const service = new NotificationService();

    // Welcome email takes { name, email }, doesn't need DB lookup necessarily if we pass data
    console.log(`Sending Welcome Email to ${targetEmail}...`);
    await service.sendWelcomeEmail({ name: "João Victor", email: targetEmail });

    console.log("Done. Check your email!");
    process.exit(0);
}

runTest().catch(console.error);
