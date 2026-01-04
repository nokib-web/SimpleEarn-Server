import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createTestUsers = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('simpleearn');
        const usersCollection = db.collection('users');
        console.log('✅ Connected to MongoDB\n');

        const testUsers = [
            {
                name: 'Test Worker',
                email: 'worker@test.com',
                photoURL: 'https://ui-avatars.com/api/?name=Test+Worker',
                role: 'worker',
                coin: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Test Buyer',
                email: 'buyer@test.com',
                photoURL: 'https://ui-avatars.com/api/?name=Test+Buyer',
                role: 'buyer',
                coin: 50,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Admin User',
                email: 'admin@test.com',
                photoURL: 'https://ui-avatars.com/api/?name=Admin+User',
                role: 'admin',
                coin: 1000,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        console.log('Creating test users in MongoDB...\n');

        for (const userData of testUsers) {
            const existingUser = await usersCollection.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`⚠️  User already exists: ${userData.email}`);
                console.log(`   Current role: ${existingUser.role}, Coins: ${existingUser.coin}`);
            } else {
                await usersCollection.insertOne(userData);
                console.log(`✅ Created user: ${userData.email}`);
                console.log(`   Role: ${userData.role}, Coins: ${userData.coin}`);
            }
            console.log('');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 IMPORTANT: Firebase Authentication Setup Required!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('These users are now in MongoDB, but you still need to:');
        console.log('');
        console.log('1️⃣  Create Firebase Authentication accounts for each user:');
        console.log('   → Go to: http://localhost:5174/register');
        console.log('   → Register with the same emails:');
        console.log('      • worker@test.com (password: Worker@123)');
        console.log('      • buyer@test.com (password: Buyer@123)');
        console.log('      • admin@test.com (password: Admin@123)');
        console.log('');
        console.log('2️⃣  OR use Google Sign-In with these emails');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('💡 TIP: The easiest way is to just register through the UI!');
        console.log('   The registration form will create both Firebase and MongoDB users.\n');

        console.log('✅ MongoDB users created successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test users:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
};

createTestUsers();
