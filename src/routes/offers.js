const express = require('express');
const Offer = require('../models/Offer');
const Property = require('../models/Property');
const { verifyToken, isAgent } = require('../middleware/auth');

const router = express.Router();

// Get user's offers
router.get('/', verifyToken, async (req, res) => {
  try {
    const offers = await Offer.find({ buyer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('property')
      .populate('agent', 'name email image');

    res.json(offers);
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get agent's received offers
router.get('/received', verifyToken, isAgent, async (req, res) => {
  try {
    const offers = await Offer.find({ agent: req.user._id })
      .sort({ createdAt: -1 })
      .populate('property')
      .populate('buyer', 'name email image');

    res.json(offers);
  } catch (error) {
    console.error('Get received offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Make an offer
router.post('/', verifyToken, async (req, res) => {
  try {
    const { propertyId, amount } = req.body;

    // Validate input
    if (!propertyId || !amount) {
      return res.status(400).json({ message: 'Property ID and amount are required' });
    }

    // Check if property exists
    const property = await Property.findById(propertyId)
      .populate('agent', 'name email image');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if property is verified
    if (property.verificationStatus !== 'verified') {
      return res.status(400).json({ message: 'Cannot make offer on unverified property' });
    }

    // Check if property is already sold
    if (property.isSold) {
      return res.status(400).json({ message: 'Property is already sold' });
    }

    // Check if amount is within price range
    if (amount < property.priceRange.min || amount > property.priceRange.max) {
      return res.status(400).json({
        message: `Offer amount must be between $${property.priceRange.min} and $${property.priceRange.max}`
      });
    }

    // Check if user is not the agent
    if (property.agent._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot make offer on your own property' });
    }

    // Check if user already has a pending offer
    const existingOffer = await Offer.findOne({
      property: propertyId,
      buyer: req.user._id,
      status: 'pending'
    });

    if (existingOffer) {
      return res.status(400).json({ message: 'You already have a pending offer for this property' });
    }

    const offer = new Offer({
      property: propertyId,
      buyer: req.user._id,
      agent: property.agent._id,
      amount,
      buyingDate: new Date()
    });

    await offer.save();
    await offer.populate('property');
    await offer.populate('buyer', 'name email image');
    await offer.populate('agent', 'name email image');

    res.status(201).json(offer);
  } catch (error) {
    console.error('Make offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept offer (agent only)
router.patch('/:id/accept', verifyToken, isAgent, async (req, res) => {
  try {
    const offer = await Offer.findOne({
      _id: req.params.id,
      agent: req.user._id,
      status: 'pending'
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Update offer status
    offer.status = 'accepted';
    await offer.save();

    // Reject all other pending offers for this property
    await Offer.updateMany(
      {
        property: offer.property,
        _id: { $ne: offer._id },
        status: 'pending'
      },
      { status: 'rejected' }
    );

    await offer.populate('property');
    await offer.populate('buyer', 'name email image');
    await offer.populate('agent', 'name email image');

    res.json(offer);
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject offer (agent only)
router.patch('/:id/reject', verifyToken, isAgent, async (req, res) => {
  try {
    const offer = await Offer.findOne({
      _id: req.params.id,
      agent: req.user._id,
      status: 'pending'
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    offer.status = 'rejected';
    await offer.save();
    await offer.populate('property');
    await offer.populate('buyer', 'name email image');
    await offer.populate('agent', 'name email image');

    res.json(offer);
  } catch (error) {
    console.error('Reject offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete purchase
router.patch('/:id/complete', verifyToken, async (req, res) => {
  try {
    const { transactionId } = req.body;

    const offer = await Offer.findOne({
      _id: req.params.id,
      buyer: req.user._id,
      status: 'accepted',
      paymentStatus: 'pending'
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Update offer
    offer.status = 'bought';
    offer.paymentStatus = 'completed';
    offer.transactionId = transactionId;
    await offer.save();

    // Update property
    const property = await Property.findById(offer.property);
    property.isSold = true;
    property.soldTo = req.user._id;
    property.soldAmount = offer.amount;
    property.soldDate = new Date();
    property.transactionId = transactionId;
    await property.save();

    await offer.populate('property');
    await offer.populate('buyer', 'name email image');
    await offer.populate('agent', 'name email image');

    res.json(offer);
  } catch (error) {
    console.error('Complete purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 