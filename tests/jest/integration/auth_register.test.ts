import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

// Mock the connectionDb module
vi.mock('@/db/connectionDb', () => {
    return {
        getMongoClient: vi.fn(),
    };
});

// Import the mocked function so we can modify its behavior
import { getMongoClient } from '@/db/connectionDb';

describe('Integration: Auth Register API', () => {
    let mongoServer: MongoMemoryServer;
    let mongoClient: MongoClient;

    beforeAll(async () => {
        // Start In-Memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        // Connect our client to this in-memory server
        mongoClient = new MongoClient(uri);
        await mongoClient.connect();

        // Tell our mocked getMongoClient to return this connected client
        // @ts-ignore
        getMongoClient.mockResolvedValue(mongoClient);
    });

    afterAll(async () => {
        if (mongoClient) await mongoClient.close();
        if (mongoServer) await mongoServer.stop();
    });

    it('should register a new user successfully', async () => {
        const body = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            cel: '11999999999'
        };

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toHaveProperty('message', 'Usuário cadastrado com sucesso!');
        // expect(data).toHaveProperty('userId'); // Register does not return userId currently

        // Verify matches DB
        const db = mongoClient.db('financeApp');
        const user = await db.collection('users').findOne({ email: 'test@example.com' });
        expect(user).toBeTruthy();
        expect(user?.name).toBe('Test User');
        expect(user?.password).not.toBe('password123'); // Should be hashed
    });

    it('should fail if email already exists', async () => {
        const body = {
            name: 'Duplicate User',
            email: 'test@example.com', // Same email as above
            password: 'password123',
            cel: '11888888888'
        };

        const request = new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/Este email já está cadastrado/i);
    });
});
