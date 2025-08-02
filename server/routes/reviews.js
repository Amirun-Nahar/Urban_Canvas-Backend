const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Property = require('../models/Property');
const { verifyToken } = require('../middleware/auth');

// Get latest reviews
router.get('/latest', async (req, res) => {
  try {
    const latestReviews = await Review.find()
      .sort({ reviewTime: -1 })
      .limit(3);
    
    res.json(latestReviews);
  } catch (error) {
    console.error('Get latest reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews for a specific property
router.get('/:propertyId', verifyToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    const reviews = await Review.find({ propertyId })
      .sort({ reviewTime: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Get property reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a review
router.post('/', verifyToken, async (req, res) => {
  try {
    const { propertyId, reviewDescription } = req.body;
    
    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const newReview = new Review({
      propertyId,
      propertyTitle: property.title,
      reviewerName: req.user.name,
      reviewerEmail: req.user.email,
      reviewerImage: req.user.image,
      reviewDescription
    });
    
    await newReview.save();
    res.status(201).json({ message: 'Review added successfully', review: newReview });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews by user email
router.get('/user/:email', verifyToken, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Ensure users can only access their own reviews
    if (email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only view your own reviews' });
    }
    
    const reviews = await Review.find({ reviewerEmail: email })
      .sort({ reviewTime: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a review
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Ensure users can only delete their own reviews
    if (review.reviewerEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only delete your own reviews' });
    }
    
    await Review.findByIdAndDelete(id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 