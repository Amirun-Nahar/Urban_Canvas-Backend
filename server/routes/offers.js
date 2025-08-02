const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const Property = require('../models/Property');
const { verifyToken, verifyAgent } = require('../middleware/auth');

// Make an offer
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      propertyId,
      offeredAmount,
      buyingDate
    } = req.body;
    
    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Validate offered amount is within price range
    if (offeredAmount < property.priceRange.min || offeredAmount > property.priceRange.max) {
      return res.status(400).json({
        message: `Offered amount must be between ${property.priceRange.min} and ${property.priceRange.max}`
      });
    }
    
    const newOffer = new Offer({
      propertyId,
      propertyTitle: property.title,
      propertyLocation: property.location,
      propertyImage: property.image,
      agentName: property.agentName,
      agentEmail: property.agentEmail,
      buyerName: req.user.name,
      buyerEmail: req.user.email,
      offeredAmount,
      buyingDate
    });
    
    await newOffer.save();
    res.status(201).json({ message: 'Offer submitted successfully', offer: newOffer });
  } catch (error) {
    console.error('Make offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get offers for a specific agent
router.get('/agent/:email', verifyAgent, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Ensure agent can only access their own offers
    if (email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only view offers for your properties' });
    }
    
    const offers = await Offer.find({ agentEmail: email }).sort({ offerTime: -1 });
    res.json(offers);
  } catch (error) {
    console.error('Get agent offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get offers for a specific buyer
router.get('/buyer/:email', verifyToken, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Ensure users can only access their own offers
    if (email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only view your own offers' });
    }
    
    const offers = await Offer.find({ buyerEmail: email }).sort({ offerTime: -1 });
    res.json(offers);
  } catch (error) {
    console.error('Get buyer offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept an offer (agent only)
router.patch('/accept/:id', verifyAgent, async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    
    // Ensure agent can only accept offers for their properties
    if (offer.agentEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only accept offers for your properties' });
    }
    
    // Update the offer status to accepted
    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      { status: 'accepted' },
      { new: true }
    );
    
    // Reject all other pending offers for the same property
    await Offer.updateMany(
      {
        _id: { $ne: id },
        propertyId: offer.propertyId,
        status: 'pending'
      },
      { status: 'rejected' }
    );
    
    res.json({ message: 'Offer accepted successfully', offer: updatedOffer });
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject an offer (agent only)
router.patch('/reject/:id', verifyAgent, async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    
    // Ensure agent can only reject offers for their properties
    if (offer.agentEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only reject offers for your properties' });
    }
    
    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true }
    );
    
    res.json({ message: 'Offer rejected successfully', offer: updatedOffer });
  } catch (error) {
    console.error('Reject offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update offer after successful payment
router.patch('/payment-success/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;
    
    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    
    // Ensure buyer can only update their own offers
    if (offer.buyerEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only complete payment for your own offers' });
    }
    
    // Ensure offer is in accepted status
    if (offer.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted offers can be paid for' });
    }
    
    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      {
        status: 'bought',
        transactionId
      },
      { new: true }
    );
    
    res.json({ message: 'Payment successful, property bought!', offer: updatedOffer });
  } catch (error) {
    console.error('Payment success error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sold properties for an agent
router.get('/agent/:email/sold', verifyAgent, async (req, res) => {
  try {
    const { email } = req.params;
    
    // Ensure agent can only access their own sold properties
    if (email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied: You can only view your own sold properties' });
    }
    
    const soldOffers = await Offer.find({
      agentEmail: email,
      status: 'bought'
    }).sort({ offerTime: -1 });
    
    // Calculate total sold amount
    const totalSold = soldOffers.reduce((total, offer) => total + offer.offeredAmount, 0);
    
    res.json({
      soldProperties: soldOffers,
      totalSold
    });
  } catch (error) {
    console.error('Get sold properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 