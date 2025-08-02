const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  propertyTitle: {
    type: String,
    required: true
  },
  propertyLocation: {
    type: String,
    required: true
  },
  propertyImage: {
    type: String,
    required: true
  },
  agentName: {
    type: String,
    required: true
  },
  agentEmail: {
    type: String,
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  buyerEmail: {
    type: String,
    required: true
  },
  offeredAmount: {
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
  transactionId: {
    type: String,
    default: ''
  },
  offerTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Offer', offerSchema); 