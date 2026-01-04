import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const createFreshUser = async () => {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('simpleearn');
        const usersCollection = db.collection('users');
        console.log('✅ Connected to MongoDB Atlas\n');

        // First, let's see what's in the database
        const allUsers = await usersCollection.find({}).toArray();
        console.log('📋 Current users in Atlas:');
        if (allUsers.length === 0) {
            console.log('   (No users found - database is empty)\n');
        } else {
            allUsers.forEach((u, i) => {
                console.log(`   ${i + 1}. ${u.email} (${u.role}) - ${u.coin} coins`);
            });
            console.log('');
        }

        // Create test users
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

        console.log('Creating test users in MongoDB Atlas...\n');

        for (const userData of testUsers) {
            const existingUser = await usersCollection.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`⚠️  User already exists: ${userData.email}`);
            } else {
                await usersCollection.insertOne(userData);
                console.log(`✅ Created: ${userData.email} (${userData.role}) - ${userData.coin} coins`);
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 NEXT STEPS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('Now you need to create Firebase Authentication accounts:');
        console.log('');
        console.log('1️⃣  Go to: http://localhost:5174/register');
        console.log('');
        console.log('2️⃣  Register with these emails:');
        console.log('   • worker@test.com (password: Worker@123)');
        console.log('   • buyer@test.com (password: Buyer@123)');
        console.log('   • admin@test.com (password: Admin@123)');
        console.log('');
        console.log('⚠️  IMPORTANT: When you register, it will try to create');
        console.log('   the user in MongoDB again. This is OK - it will just');
        console.log('   show an error but Firebase account will be created.');
        console.log('');
        console.log('3️⃣  After registration fails, try LOGGING IN instead.');
        console.log('   The Firebase account exists, MongoDB user exists,');
        console.log('   so login should work!');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
};

createFreshUser();
