const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  try {
    await verifyToken(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admin role required' });
      }
      next();
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to verify agent role
const verifyAgent = async (req, res, next) => {
  try {
    await verifyToken(req, res, () => {
      if (req.user.role !== 'agent') {
        return res.status(403).json({ message: 'Access denied: Agent role required' });
      }
      
      if (req.user.isFraud) {
        return res.status(403).json({ message: 'Access denied: Your account has been marked as fraudulent' });
      }
      
      next();
    });
  } catch (error) {
    console.error('Agent verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { verifyToken, verifyAdmin, verifyAgent }; 