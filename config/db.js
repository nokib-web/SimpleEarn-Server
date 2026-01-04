import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;

export const connectDB = async () => {
    try {
        await client.connect();
        db = client.db('SimpleEarnDB');
        console.log('✅ MongoDB connected successfully (Native Driver)');
        return db;
    } catch (error) {
        console.error(' MongoDB connection error:', error);
        process.exit(1);
    }
};

export const getDb = () => {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
};

export const getCollection = (name) => getDb().collection(name);
