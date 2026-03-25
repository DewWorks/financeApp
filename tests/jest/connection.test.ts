
import { describe, it, expect } from 'vitest';
import { getConnectionManager } from '@/db/connectionDb';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

describe('ConnectionManager Integration', () => {
    it('should connect, initialize, and have correct status', async () => {
        console.log("Starting test...");
        const db = await getConnectionManager();
        console.log("Got instance.");

        await db.init();
        console.log("Initialized.");

        const status = db.getStatus();
        console.log("Status:", status);

        expect(status.isConnected).toBe(true);
        expect(status.totalNodes).toBeGreaterThan(0);
    });

    it('should perform a read operation', async () => {
        const db = await getConnectionManager();
        // Assuming 'users' collection exists or at least can be queried
        const result = await db.read('users', async (c) => {
            return c.findOne({});
        });
        console.log("Read result:", result);
        // We don't strictly expect a result if DB is empty, but the operation should not fail
        expect(true).toBe(true);
    });
});
