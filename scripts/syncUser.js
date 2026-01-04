import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const syncUser = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('simpleearn');
        const usersCollection = db.collection('users');
        console.log('✅ Connected to MongoDB\n');

        const email = 'worker@gmail.com'; // Change this to your email
        const name = 'Nazmul Hasan Nokib'; // Change this to your name
        const role = 'worker'; // worker, buyer, or admin

        // Check if user exists
        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
            console.log(`⚠️  User already exists in MongoDB: ${email}`);
            console.log(`   Name: ${existingUser.name}`);
            console.log(`   Role: ${existingUser.role}`);
            console.log(`   Coins: ${existingUser.coin}`);
        } else {
            // Create user in MongoDB
            const user = {
                name,
                email,
                photoURL: 'https://i.ibb.co/kYK48WM0/Baby-Sitting.jpg',
                role,
                coin: role === 'worker' ? 10 : 50,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await usersCollection.insertOne(user);
            console.log(`✅ User created in MongoDB: ${email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Coins: ${user.coin}`);
        }

        console.log('\n✅ Done! You can now login with this email.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
};

syncUser();
