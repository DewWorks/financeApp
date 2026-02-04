import { MongoClient } from 'mongodb'

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    return client;
  } catch (error) {
    console.error("Falha ao conectar ao MongoDB:", error);
    throw error;
  }
}

export default clientPromise