
import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';

// Load .env explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('ERROR: MONGODB_URI not found in environment');
        return;
    }

    // Mask sensitive parts for logging
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`Attempting to connect to: ${maskedUri}`);

    try {
        const client = new MongoClient(uri);
        await client.connect();
        console.log('SUCCESS: Connected to MongoDB successfully!');

        const db = client.db("financeApp");
        const collections = await db.listCollections().toArray();
        console.log(`Available collections: ${collections.map(c => c.name).join(', ')}`);

        await client.close();
    } catch (error) {
        console.error('FAILURE: Connection failed');
        console.error(error);
    }
}

testConnection();
