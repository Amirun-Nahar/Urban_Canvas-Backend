const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Offer = require('../models/Offer');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', verifyToken, async (req, res) => {
  try {
    const { offerId } = req.body;

    // Get offer details
    const offer = await Offer.findOne({
      _id: offerId,
      buyer: req.user._id,
      status: 'accepted',
      paymentStatus: 'pending'
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found or not accepted' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(offer.amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        offerId: offer._id.toString(),
        propertyId: offer.property.toString(),
        buyerId: req.user._id.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ message: 'Webhook handler failed' });
  }
});

// Helper function to handle successful payments
async function handlePaymentSuccess(paymentIntent) {
  const { offerId } = paymentIntent.metadata;

  const offer = await Offer.findById(offerId);
  if (!offer) {
    throw new Error('Offer not found');
  }

  // Update offer status
  offer.status = 'bought';
  offer.paymentStatus = 'completed';
  offer.transactionId = paymentIntent.id;
  await offer.save();

  // Update property status
  const property = await Property.findById(offer.property);
  if (!property) {
    throw new Error('Property not found');
  }

  property.isSold = true;
  property.soldTo = offer.buyer;
  property.soldAmount = offer.amount;
  property.soldDate = new Date();
  property.transactionId = paymentIntent.id;
  await property.save();
}

// Helper function to handle failed payments
async function handlePaymentFailure(paymentIntent) {
  const { offerId } = paymentIntent.metadata;

  const offer = await Offer.findById(offerId);
  if (!offer) {
    throw new Error('Offer not found');
  }

  // Update offer status
  offer.paymentStatus = 'failed';
  await offer.save();
}

module.exports = router; 