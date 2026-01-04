import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const seedAdmin = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('simpleearn');
        const usersCollection = db.collection('users');
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@test.com';

        // Check if user exists
        const adminUser = await usersCollection.findOne({ email: adminEmail });

        if (adminUser) {
            await usersCollection.updateOne(
                { email: adminEmail },
                { $set: { role: 'admin', updated_at: new Date() } }
            );
            console.log(`User ${adminEmail} updated to admin role.`);
        } else {
            const newUser = {
                name: 'Admin User',
                email: adminEmail,
                photoURL: 'https://ui-avatars.com/api/?name=Admin+User',
                role: 'admin',
                coin: 1000,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await usersCollection.insertOne(newUser);
            console.log(`Admin user created: ${adminEmail}`);
        }

        console.log('You can now log in with this email using Google or Email/Password (ensure you create the Firebase user!)');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
};

seedAdmin();
