const admin = require('./config/firebase-admin');
require('dotenv').config();

const createFirebaseAdmin = async () => {
  try {
    // User details
    const userDetails = {
      email: 'admin@urbancanvas.com',
      password: 'Admin@123',
      displayName: 'Admin User',
      emailVerified: true
    };

    try {
      // Try to get existing user
      const userRecord = await admin.auth().getUserByEmail(userDetails.email);
      console.log('User already exists in Firebase:', userRecord.uid);
      
      // Update user if needed
      await admin.auth().updateUser(userRecord.uid, {
        emailVerified: true,
        displayName: userDetails.displayName
      });
      
      // Set custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });
      console.log('Updated user claims and details');

      return userRecord;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user if not found
        const userRecord = await admin.auth().createUser(userDetails);
        console.log('Created new user:', userRecord.uid);
        
        // Set custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });
        console.log('Set admin claims');

        return userRecord;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Execute and handle result
createFirebaseAdmin()
  .then(async (userRecord) => {
    if (userRecord) {
      // Now update MongoDB user with Firebase UID
      const mongoose = require('mongoose');
      const User = require('./models/User');
      
      try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const updatedUser = await User.findOneAndUpdate(
          { email: 'admin@urbancanvas.com' },
          { firebaseUid: userRecord.uid },
          { new: true }
        );

        if (updatedUser) {
          console.log('\nSuccessfully updated MongoDB user with Firebase UID');
          console.log('\nAdmin user details:');
          console.log('Email:', 'admin@urbancanvas.com');
          console.log('Password:', 'Admin@123');
          console.log('Firebase UID:', userRecord.uid);
        } else {
          console.log('\nWarning: Could not find MongoDB user to update');
        }
      } catch (error) {
        console.error('MongoDB update error:', error);
      } finally {
        await mongoose.disconnect();
      }
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in main execution:', error);
    process.exit(1);
  }); 