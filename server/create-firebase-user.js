const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const FIREBASE_API_KEY = 'AIzaSyD5bsHLSaoDx-_2pur8BZTiP9tfZXXGhBY';
const EMAIL = 'admin@urbancanvas.com';
const PASSWORD = 'Admin@123';

async function deleteAndCreateFirebaseUser() {
  try {
    // First try to delete the user if it exists
    try {
      const deleteResponse = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${FIREBASE_API_KEY}`,
        {
          idToken: 'PLACEHOLDER' // We don't have a valid token, this will fail
        }
      );
    } catch (deleteError) {
      // Ignore delete errors, we'll create the user anyway
      console.log('Attempting to create new user...');
    }

    // Create new user in Firebase
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        email: EMAIL,
        password: PASSWORD,
        returnSecureToken: true
      }
    );

    const { localId: uid, idToken } = response.data;
    console.log('Successfully created Firebase user:', uid);

    // Update user profile
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
      {
        idToken,
        displayName: 'Admin User',
        returnSecureToken: true
      }
    );

    console.log('Updated user profile');

    // Update MongoDB user
    await mongoose.connect(process.env.MONGO_URI);
    
    const updatedUser = await User.findOneAndUpdate(
      { email: EMAIL },
      { firebaseUid: uid },
      { new: true }
    );

    if (updatedUser) {
      console.log('\nSuccessfully updated MongoDB user with Firebase UID');
      console.log('\nAdmin user details:');
      console.log('Email:', EMAIL);
      console.log('Password:', PASSWORD);
      console.log('Firebase UID:', uid);
    } else {
      console.log('\nWarning: Could not find MongoDB user to update');
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {}
  }
}

deleteAndCreateFirebaseUser(); 