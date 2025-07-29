const express = require('express');
const Wishlist = require('../models/Wishlist');
const Property = require('../models/Property');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get user's wishlist
router.get('/', verifyToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user._id })
      .populate({
        path: 'property',
        populate: {
          path: 'agent',
          select: 'name email image'
        }
      });

    res.json(wishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if property is in wishlist
router.get('/check/:propertyId', verifyToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      user: req.user._id,
      property: req.params.propertyId
    });

    res.json(!!wishlist);
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add to wishlist
router.post('/', verifyToken, async (req, res) => {
  try {
    const { propertyId } = req.body;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if property is already in wishlist
    const existingWishlist = await Wishlist.findOne({
      user: req.user._id,
      property: propertyId
    });

    if (existingWishlist) {
      return res.status(400).json({ message: 'Property already in wishlist' });
    }

    const wishlist = new Wishlist({
      user: req.user._id,
      property: propertyId
    });

    await wishlist.save();
    await wishlist.populate({
      path: 'property',
      populate: {
        path: 'agent',
        select: 'name email image'
      }
    });

    res.status(201).json(wishlist);
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove from wishlist
router.delete('/:propertyId', verifyToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndDelete({
      user: req.user._id,
      property: req.params.propertyId
    });

    if (!wishlist) {
      return res.status(404).json({ message: 'Property not found in wishlist' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 