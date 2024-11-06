/* eslint-disable prefer-const */
import { MongoClient } from 'mongodb';

const uri: string = process.env.MONGODB_URI || "mongodb://localhost:27017";

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
  // Em modo de produção, não use uma variável global
  // eslint-disable-next-line prefer-const
  client = new MongoClient(uri, options);
  clientPromise = client.connect();

export default clientPromise;
