import { MongoClient } from 'mongodb';

declare global {
  // Adiciona a propriedade `_mongoClientPromise` ao tipo global
  namespace NodeJS {
    interface Global {
      _mongoClientPromise?: Promise<MongoClient>;
    }
  }
}
