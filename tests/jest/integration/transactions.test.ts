import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { POST, GET } from '@/app/api/transactions/route';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

// Mock DB Connection
vi.mock('@/db/connectionDb', () => {
    return {
        getMongoClient: vi.fn(),
    };
});

// Mock Next.js Cookies
const mockCookieStore = {
    get: vi.fn(),
};
vi.mock('next/headers', () => ({
    cookies: () => mockCookieStore,
}));

import { getMongoClient } from '@/db/connectionDb';

describe('Integration: Transactions API', () => {
    let mongoServer: MongoMemoryServer;
    let mongoClient: MongoClient;
    let userId: ObjectId;
    let token: string;
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();
        // @ts-ignore
        getMongoClient.mockResolvedValue(mongoClient);

        // Setup: Create a User and Token
        userId = new ObjectId();
        token = jwt.sign({ userId: userId.toString() }, JWT_SECRET, { expiresIn: '1h' });

        // Setup Cookie Mock to return valid token
        mockCookieStore.get.mockReturnValue({ value: token });
    });

    afterAll(async () => {
        if (mongoClient) await mongoClient.close();
        if (mongoServer) await mongoServer.stop();
    });

    it('should create a transaction successfully', async () => {
        const body = {
            description: 'Salário',
            amount: 5000,
            type: 'income',
            date: new Date().toISOString(),
            tag: 'Trabalho',
            isRecurring: false
        };

        const request = new Request('http://localhost:3000/api/transactions', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty('message', 'Transaction added successfully');
        expect(data).toHaveProperty('id');

        // Verify in DB
        const db = mongoClient.db('financeApp');
        const tx = await db.collection('transactions').findOne({ _id: new ObjectId(data.id) });
        expect(tx).toBeTruthy();
        expect(tx?.amount).toBe(5000);
        expect(tx?.userId.toString()).toBe(userId.toString());
    });

    it('should list transactions for the user', async () => {
        // We just created one transaction above.
        // GET requires page, limit, month params.
        const currentMonth = new Date().getMonth() + 1;
        const url = `http://localhost:3000/api/transactions?page=1&limit=10&month=${currentMonth}`;

        const request = new Request(url, {
            method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200); // Wait, GET returns json directly?
        // Checking route.ts: return NextResponse.json({ transactions, totalPages });
        // Response.json() resolves to that object.

        expect(data).toHaveProperty('transactions');
        expect(Array.isArray(data.transactions)).toBe(true);
        expect(data.transactions.length).toBeGreaterThan(0);
        expect(data.transactions[0].description).toBe('Salário');
    });
});
