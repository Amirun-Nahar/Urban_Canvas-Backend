const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

let firebaseAdmin = null;

// Initialize Firebase Admin
const initializeFirebaseAdmin = () => {
  try {
    if (!admin.apps.length) {
      // Use service account file instead of environment variables
      const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
      
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
      });

      console.log('Firebase Admin initialized successfully');
    } else {
      firebaseAdmin = admin.app();
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
  return firebaseAdmin;
};

// Initialize on module load
initializeFirebaseAdmin();

module.exports = admin; 