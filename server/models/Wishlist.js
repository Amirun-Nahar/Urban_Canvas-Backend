const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Drop any existing indexes and create the correct one
wishlistSchema.index({ userEmail: 1, propertyId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema); 