import { describe, it, expect, vi } from 'vitest';

describe('MongoClient Proxy for Staging', () => {
    it('should map dbName to process.env.MONGODB_DB_NAME if provided', () => {
        const mockDb = vi.fn().mockImplementation((name) => ({ databaseName: name }));
        const mockClient = {
            db: mockDb,
            close: vi.fn(),
        };

        const proxiedClient = new Proxy(mockClient, {
            get(target, prop, receiver) {
                if (prop === 'db') {
                    return function(dbName?: string, options?: any) {
                        const targetDbName = process.env.MONGODB_DB_NAME || dbName || 'financeApp';
                        return target.db(targetDbName, options);
                    };
                }
                const value = Reflect.get(target, prop, receiver);
                return typeof value === 'function' ? value.bind(target) : value;
            }
        });

        // Test 1: No MONGODB_DB_NAME set
        delete process.env.MONGODB_DB_NAME;
        let db = proxiedClient.db('financeApp');
        expect(db.databaseName).toBe('financeApp');

        // Test 2: MONGODB_DB_NAME set to staging
        process.env.MONGODB_DB_NAME = 'financeApp_staging';
        db = proxiedClient.db('financeApp');
        expect(db.databaseName).toBe('financeApp_staging');

        // Test 3: MONGODB_DB_NAME overrides any custom database name passed
        db = proxiedClient.db('custom_db');
        expect(db.databaseName).toBe('financeApp_staging');

        // Clean up
        delete process.env.MONGODB_DB_NAME;
    });
});
