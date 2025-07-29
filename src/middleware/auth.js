const admin = require('../config/firebase-admin');
const User = require('../models/User');

// Verify Firebase token and attach user to request
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Verifying token...');

    try {
      // Verify token with Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Token verified for uid:', decodedToken.uid);

      // Get user from database
      const user = await User.findOne({
        $or: [
          { firebaseUid: decodedToken.uid },
          { email: decodedToken.email }
        ]
      });

      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({ message: 'User not found' });
      }

      // Update user's Firebase UID if not set
      if (!user.firebaseUid && decodedToken.uid) {
        user.firebaseUid = decodedToken.uid;
        await user.save();
      }

      // Attach user to request
      req.user = user;
      req.firebaseUser = decodedToken;
      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      
      if (verifyError.code === 'auth/id-token-expired') {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      return res.status(401).json({ 
        message: 'Invalid token',
        error: verifyError.message 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is an admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Check if user is an agent
const isAgent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.role !== 'agent') {
    return res.status(403).json({ message: 'Agent access required' });
  }
  next();
};

// Check if user is an admin or agent
const isAdminOrAgent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!['admin', 'agent'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin or agent access required' });
  }
  next();
};

// Check if user is the owner of the resource or an admin
const isOwnerOrAdmin = (resourceField) => async (req, res, next) => {
  try {
    const resource = await req.model.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const isOwner = resource[resourceField]?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    req.resource = resource;
    next();
  } catch (error) {
    console.error('isOwnerOrAdmin middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isAgent,
  isAdminOrAgent,
  isOwnerOrAdmin
}; 