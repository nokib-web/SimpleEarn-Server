import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const checkUser = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('simpleearn');
        const usersCollection = db.collection('users');
        console.log('✅ Connected to MongoDB\n');

        const email = 'worker@gmail.com';
        const user = await usersCollection.findOne({ email });

        if (user) {
            console.log('✅ User EXISTS in MongoDB:');
            console.log('   Email:', user.email);
            console.log('   Name:', user.name);
            console.log('   Role:', user.role);
            console.log('   Coins:', user.coin);
            console.log('   ID:', user._id);
        } else {
            console.log('❌ User NOT FOUND in MongoDB');
            console.log('   Email searched:', email);
        }

        // Also show all users
        const allUsers = await usersCollection.find({}).toArray();
        console.log('\n📋 All users in database:');
        if (allUsers.length === 0) {
            console.log('   (No users found)');
        } else {
            allUsers.forEach((u, i) => {
                console.log(`   ${i + 1}. ${u.email} (${u.role}) - ${u.coin} coins`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
};

checkUser();
