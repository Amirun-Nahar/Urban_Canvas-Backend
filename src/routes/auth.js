const express = require('express');
const admin = require('../config/firebase-admin');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Auth API is working!' });
});

// Google authentication
router.post('/google', async (req, res) => {
  try {
    const { token, email, name, image } = req.body;
    console.log('Google auth request received:', { email, name });

    if (!token || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Token and email are required' 
      });
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Token verified:', decodedToken.uid);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token',
        error: verifyError.message 
      });
    }

    try {
      // Find existing user
      let user = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { firebaseUid: decodedToken.uid }
        ]
      });

      if (user) {
        // Update existing user
        user.name = name || user.name;
        user.image = image || user.image;
        user.firebaseUid = decodedToken.uid;
        user.isEmailVerified = true;
        user.lastLogin = new Date();
        
        await user.save();
        console.log('User updated:', user._id);
      } else {
        // Create new user
        user = new User({
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          image: image,
          firebaseUid: decodedToken.uid,
          isEmailVerified: true,
          lastLogin: new Date()
        });

        await user.save();
        console.log('New user created:', user._id);
      }

      // Generate a new Firebase custom token
      const customToken = await admin.auth().createCustomToken(decodedToken.uid, {
        email: user.email,
        role: user.role
      });

      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        token: customToken
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      isFraud: user.isFraud
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const image = req.file?.path;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (image) user.image = image;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      isFraud: user.isFraud
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 