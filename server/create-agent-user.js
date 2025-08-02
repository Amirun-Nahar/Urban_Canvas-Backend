const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const FIREBASE_API_KEY = 'AIzaSyD5bsHLSaoDx-_2pur8BZTiP9tfZXXGhBY';
const EMAIL = 'agent@urbancanvas.com';
const PASSWORD = 'Agent@123';

async function createAgentUser() {
  try {
    // First create the user in MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    
    // Check if user already exists in MongoDB
    let user = await User.findOne({ email: EMAIL });
    if (!user) {
      // Hash password for MongoDB
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(PASSWORD, salt);

      // Create new user in MongoDB with agent role
      user = new User({
        name: 'Agent User',
        email: EMAIL,
        password: hashedPassword,
        role: 'agent',
        image: 'https://i.ibb.co/MBtjqXQ/no-avatar.gif'
      });
      await user.save();
      console.log('Created agent user in MongoDB');
    } else {
      console.log('Agent user already exists in MongoDB');
    }

    // Create user in Firebase
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
        displayName: 'Agent User',
        returnSecureToken: true
      }
    );

    console.log('Updated user profile');

    // Update MongoDB user with Firebase UID
    const updatedUser = await User.findOneAndUpdate(
      { email: EMAIL },
      { firebaseUid: uid },
      { new: true }
    );

    if (updatedUser) {
      console.log('\nSuccessfully updated MongoDB user with Firebase UID');
      console.log('\nAgent user details:');
      console.log('Email:', EMAIL);
      console.log('Password:', PASSWORD);
      console.log('Firebase UID:', uid);
      console.log('Role:', updatedUser.role);
    } else {
      console.log('\nWarning: Could not find MongoDB user to update');
    }

  } catch (error) {
    if (error.response?.data?.error?.message === 'EMAIL_EXISTS') {
      console.log('User already exists in Firebase. Please delete the user from Firebase Console and try again.');
    } else {
      console.error('Error:', error.response?.data || error);
    }
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {}
  }
}

createAgentUser(); 