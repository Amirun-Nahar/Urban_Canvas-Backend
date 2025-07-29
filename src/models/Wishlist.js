const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ property: 1 });

// Add compound unique index to prevent duplicate wishlists
wishlistSchema.index({ user: 1, property: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist; 