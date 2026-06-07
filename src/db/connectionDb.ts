import { MongoClient } from 'mongodb'

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI
const options: any = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!uri) {
  console.warn("WARN: MONGODB_URI is missing. Database connection will fail when accessed.");
  clientPromise = Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'));
} else {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    clientPromise = global._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
}

export async function getMongoClient(): Promise<MongoClient> {
  try {
    const client = await clientPromise;
    
    // Proxy the MongoClient to dynamically map the db name
    return new Proxy(client, {
      get(target, prop, receiver) {
        if (prop === 'db') {
          return function(dbName?: string, options?: any) {
            // Override database name using process.env.MONGODB_DB_NAME if provided,
            // otherwise fallback to the requested dbName, or 'financeApp'
            const targetDbName = process.env.MONGODB_DB_NAME || dbName || 'financeApp';
            return target.db(targetDbName, options);
          };
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  } catch (error) {
    console.error("Falha ao conectar ao MongoDB:", error);
    throw error;
  }
}

export default clientPromise