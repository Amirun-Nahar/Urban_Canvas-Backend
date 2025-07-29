const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priceRange: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    }
  },
  description: {
    type: String,
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  isAdvertised: {
    type: Boolean,
    default: false
  },
  features: [{
    type: String,
    trim: true
  }],
  propertyType: {
    type: String,
    enum: ['house', 'apartment', 'condo', 'villa', 'office', 'land'],
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'pending'],
    default: 'available'
  },
  area: {
    type: Number,
    required: true
  },
  bedrooms: {
    type: Number,
    required: function() {
      return ['house', 'apartment', 'condo', 'villa'].includes(this.propertyType);
    }
  },
  bathrooms: {
    type: Number,
    required: function() {
      return ['house', 'apartment', 'condo', 'villa'].includes(this.propertyType);
    }
  },
  yearBuilt: {
    type: Number,
    required: function() {
      return ['house', 'apartment', 'condo', 'villa', 'office'].includes(this.propertyType);
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for reviews
propertySchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'property'
});

// Virtual field for wishlists
propertySchema.virtual('wishlists', {
  ref: 'Wishlist',
  localField: '_id',
  foreignField: 'property'
});

// Virtual field for offers
propertySchema.virtual('offers', {
  ref: 'Offer',
  localField: '_id',
  foreignField: 'property'
});

// Indexes
propertySchema.index({ location: 'text', title: 'text' });
propertySchema.index({ verificationStatus: 1 });
propertySchema.index({ agent: 1 });
propertySchema.index({ isAdvertised: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ 'priceRange.min': 1, 'priceRange.max': 1 });

// Pre-save middleware
propertySchema.pre('save', function(next) {
  // Ensure min price is less than max price
  if (this.priceRange.min > this.priceRange.max) {
    const temp = this.priceRange.min;
    this.priceRange.min = this.priceRange.max;
    this.priceRange.max = temp;
  }
  next();
});

// Methods
propertySchema.methods.isOwner = function(userId) {
  return this.agent.toString() === userId.toString();
};

propertySchema.methods.canMakeOffer = function(offerAmount) {
  return offerAmount >= this.priceRange.min && offerAmount <= this.priceRange.max;
};

const Property = mongoose.model('Property', propertySchema);

module.exports = Property; 