import {Document, InsertManyResult, MongoClient} from "mongodb";

module.exports = (on: (arg0: string, arg1: { seedDatabase(): Promise<InsertManyResult<Document>>; }) => void) => {
    on('task', {
        seedDatabase() {
            const uri = 'mongodb://localhost:27017';
            const client = new MongoClient(uri);
            return client.connect().then(() => {
                const db = client.db('financeApp');
                return db.collection('transactions').insertMany([
                    { type: 'income', description: 'Initial Income', amount: 1000, date: '2024-11-28', tag: 'Salário' },
                ]);
            });
        },
    });
};
