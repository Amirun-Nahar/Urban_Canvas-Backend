const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const admin = require('../config/firebase-admin');
const { verifyFirebaseToken } = require('../middleware/firebase-auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, image } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword,
      image: image || undefined
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Social login/register
router.post('/social-login', async (req, res) => {
  try {
    const { name, email, image, firebaseUid } = req.body;

    // Find user or create a new one
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create a new user with a random password (they'll login via social auth)
      const randomPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      
      user = new User({
        name,
        email,
        password: hashedPassword,
        image: image || undefined,
        firebaseUid // Store the Firebase UID for future reference
      });
      
      await user.save();
    } else if (!user.firebaseUid && firebaseUid) {
      // Update existing user with Firebase UID if not already set
      user.firebaseUid = firebaseUid;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Social login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({ message: 'Server error during social login' });
  }
});

// Get current user with JWT
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user with Firebase token
router.get('/me-firebase', verifyFirebaseToken, async (req, res) => {
  try {
    // Get Firebase user details
    const firebaseUser = await admin.auth().getUser(req.firebaseUid);
    
    // Find user in our database
    const user = await User.findOne({ email: firebaseUser.email }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get current user with Firebase token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if the requester is an admin
    const requester = await User.findById(req.userId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete users' });
    }
    
    // If user has a Firebase UID, delete from Firebase as well
    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch (firebaseError) {
        console.error('Error deleting Firebase user:', firebaseError);
        // Continue with deletion from our database even if Firebase deletion fails
      }
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error during user deletion' });
  }
});

module.exports = router; 