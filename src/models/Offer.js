const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  buyingDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'bought'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Add indexes
offerSchema.index({ property: 1 });
offerSchema.index({ buyer: 1 });
offerSchema.index({ agent: 1 });
offerSchema.index({ status: 1 });
offerSchema.index({ paymentStatus: 1 });

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer; 