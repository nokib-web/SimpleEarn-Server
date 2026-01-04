import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!admin.apps.length) {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        if (projectId && privateKey && clientEmail) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    privateKey,
                    clientEmail,
                }),
            });
            console.log('Firebase Admin initialized from environment variables');
        } else {
            // Fallback: try loading firebase-admin-sdk.json from project root
            const saPath = path.resolve(process.cwd(), 'firebase-admin-sdk.json');
            if (fs.existsSync(saPath)) {
                try {
                    const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                    console.log('Firebase Admin initialized from firebase-admin-sdk.json');
                } catch (fileErr) {
                    console.error('Failed to parse firebase-admin-sdk.json:', fileErr.message);
                    console.warn('Firebase Admin: Missing environment variables and failed to load local service account file. Firebase Admin features will be disabled.');
                }
            } else {
                console.warn('Firebase Admin: Missing environment variables. firebase-admin-sdk.json not found in project root. Firebase Admin features will be disabled.');
                console.warn('Required: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL OR provide firebase-admin-sdk.json');
            }
        }
    } catch (error) {
        console.error('Firebase Admin initialization error:', error.message);
        console.error('Make sure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL are set in your .env file or provide firebase-admin-sdk.json');
    }
}

export default admin;

