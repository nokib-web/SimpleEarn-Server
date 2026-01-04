import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const populateRealDB = async () => {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('SimpleEarnDB');
        const usersCollection = db.collection('users');

        const testUsers = [
            {
                name: 'Nazmul Hasan Nokib',
                email: 'worker@gmail.com',
                photoURL: 'https://ui-avatars.com/api/?name=Nazmul+Hasan+Nokib',
                role: 'worker',
                coin: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Admin User',
                email: 'admin@simpleearn.com',
                photoURL: 'https://ui-avatars.com/api/?name=Admin',
                role: 'admin',
                coin: 1000,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const user of testUsers) {
            await usersCollection.updateOne(
                { email: user.email },
                { $setOnInsert: user },
                { upsert: true }
            );
            console.log(`Ensured user: ${user.email}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
        process.exit(0);
    }
};

populateRealDB();
