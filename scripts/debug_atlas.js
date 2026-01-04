import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const testServerData = async () => {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('simpleearn');

        console.log('--- Collections ---');
        const collections = await db.listCollections().toArray();
        collections.forEach(c => console.log(c.name));

        console.log('\n--- Users ---');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => console.log(`${u.email} - ${u.role}`));

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
        process.exit(0);
    }
};

testServerData();
