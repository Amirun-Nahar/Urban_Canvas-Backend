const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: 'https://i.ibb.co/MBtjqXQ/no-avatar.gif'
  },
  role: {
    type: String,
    enum: ['user', 'agent', 'admin'],
    default: 'user'
  },
  isFraud: {
    type: Boolean,
    default: false
  },
  firebaseUid: {
    type: String,
    sparse: true // Allows null values and maintains uniqueness for non-null values
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create an index for the firebaseUid field to improve lookup performance
userSchema.index({ firebaseUid: 1 }, { sparse: true });

module.exports = mongoose.model('User', userSchema); 