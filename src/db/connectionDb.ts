import { MongoClient } from 'mongodb'
import { ConnectionManager } from 'replica-failover-mongodb-ts';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
  // eslint-disable-next-line no-var
  var _connectionManager: ConnectionManager | undefined
}

const uri = process.env.MONGODB_URI
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const options: any = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

let connectionManager: ConnectionManager;

if (!uri) {
  console.warn("WARN: MONGODB_URI is missing. Database connection will fail when accessed.");
  clientPromise = Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'));
} else {
  // Initialize ConnectionManager
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise

    // Singleton for Development (Hot Reload safe)
    if (!global._connectionManager) {
      global._connectionManager = new ConnectionManager({
        connectionString: uri,
        // Optional: Customize healthCheckIntervalMs, etc if needed
      });
      // We don't await here to not block import, but we should init
      global._connectionManager.init().catch(err => console.error("Failed to init ConnectionManager in Dev:", err));
    }
    connectionManager = global._connectionManager;

  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()

    // Production: Standard Init
    connectionManager = new ConnectionManager({
      connectionString: uri
    });
    // Init in background or await where needed. 
    // Usually best to init at app startup, but here we lazy init or auto-init.
    connectionManager.init().catch(err => console.error("Failed to init ConnectionManager in Prod:", err));
  }
}

export async function getMongoClient(): Promise<MongoClient> {
  try {
    const client = await clientPromise;
    return client;
  } catch (error) {
    console.error("Falha ao conectar ao MongoDB:", error);
    throw error;
  }
}

/**
 * Returns the ConnectionManager instance for advanced failover handling.
 * Ensures it's initialized.
 */
export async function getConnectionManager(): Promise<ConnectionManager> {
  if (!connectionManager) {
    throw new Error("ConnectionManager not initialized. Check MONGODB_URI.");
  }
  // Ensure it's connected/connecting
  // The library handles idempotency of init() internally usually, or we can check status
  // For now, we return the instance. Ideally the app should await init() at startup.
  return connectionManager;
}

export default clientPromise