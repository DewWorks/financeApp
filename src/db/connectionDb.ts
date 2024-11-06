import { MongoClient } from 'mongodb';

const uri: string = process.env.MONGODB_URI || "mongodb+srv://joaovictorpfr:FgzSSwobypYQCI4U@financeapp.qgkzu.mongodb.net/?retryWrites=true&w=majority&appName=financeApp"; 

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'production') {
  // Em modo de produção, não use uma variável global
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
} else {
  // Em modo de desenvolvimento, use uma variável global para manter a conexão
  const globalWithMongo = global as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
}

export default clientPromise;
