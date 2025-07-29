const express = require('express');
const Review = require('../models/Review');
const Property = require('../models/Property');
const { verifyToken, isAdmin, isOwnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get latest reviews
router.get('/latest', async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('reviewer', 'name email image')
      .populate({
        path: 'property',
        select: 'title agent',
        populate: {
          path: 'agent',
          select: 'name email image'
        }
      });

    res.json(reviews);
  } catch (error) {
    console.error('Get latest reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews for a property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const reviews = await Review.find({ property: req.params.propertyId })
      .sort({ createdAt: -1 })
      .populate('reviewer', 'name email image')
      .populate({
        path: 'property',
        select: 'title agent',
        populate: {
          path: 'agent',
          select: 'name email image'
        }
      });

    res.json(reviews);
  } catch (error) {
    console.error('Get property reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reviews
router.get('/user', verifyToken, async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('reviewer', 'name email image')
      .populate({
        path: 'property',
        select: 'title agent',
        populate: {
          path: 'agent',
          select: 'name email image'
        }
      });

    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add review
router.post('/', verifyToken, async (req, res) => {
  try {
    const { propertyId, description } = req.body;

    // Validate input
    if (!propertyId || !description) {
      return res.status(400).json({ message: 'Property ID and description are required' });
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user has already reviewed this property
    const existingReview = await Review.findOne({
      property: propertyId,
      reviewer: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this property' });
    }

    const review = new Review({
      property: propertyId,
      reviewer: req.user._id,
      description
    });

    await review.save();
    await review.populate('reviewer', 'name email image');
    await review.populate({
      path: 'property',
      select: 'title agent',
      populate: {
        path: 'agent',
        select: 'name email image'
      }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete review (owner or admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      $or: [
        { reviewer: req.user._id },
        { role: 'admin' }
      ]
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.deleteOne();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reviews (admin only)
router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate('reviewer', 'name email image')
      .populate({
        path: 'property',
        select: 'title agent',
        populate: {
          path: 'agent',
          select: 'name email image'
        }
      });

    res.json(reviews);
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 