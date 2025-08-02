const admin = require('../config/firebase-admin');

/**
 * Middleware to verify Firebase ID tokens
 * This can be used alongside or as an alternative to JWT authentication
 */
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Add the Firebase UID to the request
    req.firebaseUid = decodedToken.uid;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};

module.exports = { verifyFirebaseToken }; 