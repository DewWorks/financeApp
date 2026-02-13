declare module 'replica-failover-mongodb-ts' {
    import { EventEmitter } from 'events';
    import { MongoClient, Db, Collection } from 'mongodb';

    export interface ConnectionManagerOptions {
        connectionString?: string;
        replicaUri?: string;
        nodes?: string[];
        dbName?: string;
        healthCheckIntervalMs?: number;
        webhookUrl?: string;
        maxPoolSize?: number;
        minPoolSize?: number;
    }

    export type ReadPreferenceMode = 'primary' | 'secondary' | 'secondaryPreferred';

    export class ConnectionManager extends EventEmitter {
        constructor(opts: ConnectionManagerOptions);
        init(): Promise<void>;
        getStatus(): {
            isConnected: boolean;
            dbName: string;
            primary: string | null;
            secondaries: string[];
            totalNodes: number;
        };
        getDb(): Db | null;
        read<T = any>(
            collectionName: string,
            op: (collection: Collection) => Promise<T>,
            meta?: any,
            readPref?: ReadPreferenceMode
        ): Promise<T>;
        write<T = any>(
            collectionName: string,
            op: (collection: Collection) => Promise<T>,
            meta?: any
        ): Promise<T>;
        close(): Promise<void>;
    }
}
