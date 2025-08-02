const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { verifyToken, verifyAgent, verifyAdmin } = require('../middleware/auth');

// Get all verified properties (public)
router.get('/', async (req, res) => {
  try {
    const { location } = req.query;
    let query = { verificationStatus: 'verified' };
    
    // Add location filter if provided
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Get sort option if provided
    const { sort } = req.query;
    let sortOption = {};
    
    if (sort === 'price-asc') {
      sortOption = { 'priceRange.min': 1 };
    } else if (sort === 'price-desc') {
      sortOption = { 'priceRange.min': -1 };
    } else {
      sortOption = { createdAt: -1 }; // Default sort by newest
    }
    
    const properties = await Property.find(query).sort(sortOption);
    res.json(properties);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get advertised properties (public)
router.get('/advertised', async (req, res) => {
  try {
    const properties = await Property.find({
      verificationStatus: 'verified',
      isAdvertised: true
    }).limit(4);
    
    res.json(properties);
  } catch (error) {
    console.error('Get advertised properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single property by ID (private)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new property (agent only)
router.post('/', verifyAgent, async (req, res) => {
  try {
    const {
      title,
      location,
      image,
      priceRange,
      description
    } = req.body;
    
    const newProperty = new Property({
      title,
      location,
      image,
      priceRange,
      description,
      agentName: req.user.name,
      agentEmail: req.user.email,
      agentImage: req.user.image
    });
    
    await newProperty.save();
    res.status(201).json({ message: 'Property added successfully', property: newProperty });
  } catch (error) {
    console.error('Add property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get properties by agent email (agent only)
router.get('/agent/:email', verifyAgent, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Ensure agent can only access their own properties
    if (email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only view your own properties' });
    }
    
    const properties = await Property.find({ agentEmail: email }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Get agent properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a property (agent only)
router.put('/:id', verifyAgent, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      location,
      image,
      priceRange,
      description
    } = req.body;
    
    // Find property and check ownership
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    if (property.agentEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only update your own properties' });
    }
    
    // Don't allow updates if property is rejected
    if (property.verificationStatus === 'rejected') {
      return res.status(403).json({ message: 'Cannot update a rejected property' });
    }
    
    // Update property
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        title,
        location,
        image,
        priceRange,
        description,
        // Reset verification status if property is modified
        verificationStatus: 'pending'
      },
      { new: true }
    );
    
    res.json({ message: 'Property updated successfully', property: updatedProperty });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a property (agent only)
router.delete('/:id', verifyAgent, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find property and check ownership
    const property = await Property.findById(id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    if (property.agentEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only delete your own properties' });
    }
    
    await Property.findByIdAndDelete(id);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 