import { MongoMemoryServer } from 'mongodb-memory-server';
import { getMongoClient } from '@/db/connectionDb';
import { jest } from '@jest/globals';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// Mock para getMongoClient
jest.mock('@/db/connectionDb', () => ({
    getMongoClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        set: jest.fn(), // Mocka a função set que configura o cookie
    })),
}));

describe('API Test', () => {
    let mongoServer: MongoMemoryServer;
    let mockMongoClient: MongoClient;

    beforeAll(async () => {
        console.log('Iniciando MongoMemoryServer...');

        // Inicializa o MongoDB em memória
        mongoServer = await MongoMemoryServer.create();
        console.log('MongoMemoryServer iniciado com URI:', mongoServer.getUri());

        console.log('Configurando mock do MongoClient...');

        // Mock para MongoClient retornando o banco em memória
        mockMongoClient = {
            db: jest.fn().mockReturnValue({
                collection: jest.fn().mockReturnValue({
                    insertOne: jest.fn(async () => {
                        console.log('Mock de inserção de uma transação');
                        return { insertedId: 'mocked-id' };
                    }), // Mock de inserção
                    findOne: jest.fn(async () => {
                        console.log('Mock de busca por usuário');
                        return {
                            _id: 'mocked-user-id',
                            email: 'joaovictorpfr@gmail.com',
                            password: await bcrypt.hash('23082005', 10),
                        }; // Mock de usuário com a senha hasheada
                    }),
                }),
            }),
        } as unknown as MongoClient;

        // Configura o mock para getMongoClient
        jest.mocked(getMongoClient).mockResolvedValue(mockMongoClient);
        console.log('Mock do MongoClient configurado.');
    });

    afterAll(async () => {
        console.log('Parando o MongoMemoryServer...');
        // Para o MongoDB em memória
        await mongoServer.stop();
        console.log('MongoMemoryServer parado.');
    });

    it('should initialize MongoDB in memory', async () => {
        console.log('Verificando URI do MongoMemoryServer...');
        // Verifica se o servidor do MongoDB foi iniciado corretamente
        expect(mongoServer.getUri()).toContain('mongodb://127.0.0.1');
        console.log('MongoDB em memória foi inicializado com sucesso.');
    });

    it('should mock a user retrieval from the database', async () => {
        console.log('Recuperando o banco de dados para buscar o usuário...');
        const db = mockMongoClient.db();
        const collection = db.collection('users');

        console.log('Buscando usuário com e-mail "joaovictorpfr@gmail.com"...');
        const user = await collection.findOne({ email: 'joaovictorpfr@gmail.com' });

        console.log('Usuário recuperado:', user);
        expect(user).toBeDefined();
        console.log('Usuário encontrado com sucesso.');
    });
});
