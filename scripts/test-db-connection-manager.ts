
import { getConnectionManager } from '../src/db/connectionDb';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log("Testing ConnectionManager...");
    try {
        const db = await getConnectionManager();
        console.log("ConnectionManager instance obtained.");

        console.log("Initializing...");
        await db.init();
        console.log("Initialized.");

        const status = db.getStatus();
        console.log("Status:", status);

        if (!status.isConnected) {
            throw new Error("Not connected according to status!");
        }

        console.log("Attempting read...");
        const result = await db.read('users', async (c) => {
            return c.findOne({});
        });
        console.log("Read success. Result sample:", result ? result._id : "null");

        console.log("Verification Successful.");
        process.exit(0);
    } catch (error) {
        console.error("Verification Failed:", error);
        process.exit(1);
    }
}

main();
