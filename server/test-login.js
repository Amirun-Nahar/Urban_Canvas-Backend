const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const testLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@urbancanvas.com';
    const password = 'Admin@123';

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('User found:', {
      name: user.name,
      email: user.email,
      role: user.role,
      passwordHash: user.password.substring(0, 20) + '...' // Show part of the hash
    });

    // Test password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('\nPassword check result:', isMatch);

    if (!isMatch) {
      // Let's create a new hash to compare
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      console.log('\nDebug info:');
      console.log('Current password hash:', user.password);
      console.log('New hash for same password:', newHash);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testLogin(); 