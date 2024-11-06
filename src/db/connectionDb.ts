/* eslint-disable prefer-const */
import { MongoClient } from 'mongodb';

const uri: string = process.env.MONGODB_URI || "MONGODB_URI=mongodb+srv://joaovictorpfr:FgzSSwobypYQCI4U@financeapp.qgkzu.mongodb.net/?retryWrites=true&w=majority&appName=financeApp";

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
  client = new MongoClient(uri, options);
  clientPromise = client.connect();

export default clientPromise;
