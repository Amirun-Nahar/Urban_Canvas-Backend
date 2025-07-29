const express = require('express');
const admin = require('firebase-admin');
const User = require('../models/User');
const Property = require('../models/Property');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', verifyToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['user', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow changing own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot change own role' });
    }

    user.role = role;
    await user.save();

    // Update Firebase custom claims
    await admin.auth().setCustomUserClaims(user._id.toString(), {
      role: user.role,
      isFraud: user.isFraud
    });

    res.json(user);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark user as fraud (admin only)
router.patch('/:id/fraud', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow marking self as fraud
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot mark self as fraud' });
    }

    // Only allow marking agents as fraud
    if (user.role !== 'agent') {
      return res.status(400).json({ message: 'Only agents can be marked as fraud' });
    }

    user.isFraud = true;
    await user.save();

    // Update Firebase custom claims
    await admin.auth().setCustomUserClaims(user._id.toString(), {
      role: user.role,
      isFraud: true
    });

    // Remove all properties from this agent from public listings
    await Property.updateMany(
      { agent: user._id },
      { verificationStatus: 'rejected' }
    );

    res.json(user);
  } catch (error) {
    console.error('Mark as fraud error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete own account' });
    }

    // Delete user from Firebase
    try {
      await admin.auth().deleteUser(user._id.toString());
    } catch (firebaseError) {
      console.error('Firebase user deletion error:', firebaseError);
      // Continue with local deletion even if Firebase deletion fails
    }

    // Delete user from database
    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 