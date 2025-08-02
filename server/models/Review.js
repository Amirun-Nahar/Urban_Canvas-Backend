const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  propertyTitle: {
    type: String,
    required: true
  },
  reviewerName: {
    type: String,
    required: true
  },
  reviewerEmail: {
    type: String,
    required: true
  },
  reviewerImage: {
    type: String,
    required: true
  },
  reviewDescription: {
    type: String,
    required: true
  },
  reviewTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema); 