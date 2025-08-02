const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Property = require('../models/Property');
const { verifyToken } = require('../middleware/auth');

// Add a property to wishlist
router.post('/', verifyToken, async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userEmail = req.user.email;
    
    // Validate input
    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' });
    }
    
    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }
    
    // Validate ObjectId format
    if (!require('mongoose').Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ message: 'Invalid property ID format' });
    }
    
    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check if already in wishlist
    const existingWishlist = await Wishlist.findOne({ userEmail, propertyId });
    if (existingWishlist) {
      return res.status(400).json({ message: 'Property already in wishlist' });
    }
    
    const wishlistItem = new Wishlist({
      userEmail,
      propertyId
    });
    
    await wishlistItem.save();
    res.status(201).json({ message: 'Added to wishlist successfully', wishlistItem });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Property already in wishlist' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's wishlist with property details
router.get('/:email', verifyToken, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Ensure users can only access their own wishlist
    if (email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only view your own wishlist' });
    }
    
    // Get all wishlist items for the user
    const wishlistItems = await Wishlist.find({ userEmail: email });
    
    // Get property details for each wishlist item
    const wishlistWithDetails = await Promise.all(
      wishlistItems.map(async (item) => {
        const property = await Property.findById(item.propertyId);
        return {
          _id: item._id,
          propertyId: item.propertyId,
          addedAt: item.addedAt,
          property: property || { message: 'Property no longer available' }
        };
      })
    );
    
    res.json(wishlistWithDetails);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove from wishlist
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const wishlistItem = await Wishlist.findById(id);
    if (!wishlistItem) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }
    
    // Ensure users can only remove from their own wishlist
    if (wishlistItem.userEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only remove from your own wishlist' });
    }
    
    await Wishlist.findByIdAndDelete(id);
    res.json({ message: 'Removed from wishlist successfully' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 