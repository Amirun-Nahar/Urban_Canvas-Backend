const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Offer = require('../models/Offer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a payment intent
router.post('/create-payment-intent', verifyToken, async (req, res) => {
  try {
    const { offerId } = req.body;
    
    // Find the offer
    const offer = await Offer.findById(offerId);
    
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    
    // Check if the offer belongs to the current user
    if (offer.buyerEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'You are not authorized to make payment for this offer' });
    }
    
    // Check if the offer is accepted
    if (offer.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Payment can only be made for accepted offers' });
    }
    
    // Calculate the amount in cents (Stripe requires amount in cents)
    const amount = Math.round(offer.offeredAmount * 100);
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: {
        offerId: offerId,
        propertyTitle: offer.propertyTitle,
        buyerEmail: offer.buyerEmail
      }
    });
    
    // Return the client secret
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
    
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ success: false, message: 'Error creating payment intent', error: error.message });
  }
});

// Webhook to handle successful payments
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      try {
        // Update the offer status to bought
        const offerId = paymentIntent.metadata.offerId;
        const offer = await Offer.findById(offerId);
        
        if (offer) {
          offer.status = 'bought';
          offer.transactionId = paymentIntent.id;
          await offer.save();
          console.log(`Payment for offer ${offerId} completed successfully`);
        }
      } catch (error) {
        console.error('Error updating offer status:', error);
      }
      
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
});

module.exports = router; 