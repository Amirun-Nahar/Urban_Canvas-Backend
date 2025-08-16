const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const Offer = require('../models/Offer');
const { verifyAdmin } = require('../middleware/auth');

// Get platform statistics (public endpoint for homepage)
router.get('/statistics', async (req, res) => {
  try {
    // Get total properties
    const totalProperties = await Property.countDocuments();
    const verifiedProperties = await Property.countDocuments({ verificationStatus: 'verified' });
    const advertisedProperties = await Property.countDocuments({ isAdvertised: true });
    const pendingProperties = await Property.countDocuments({ verificationStatus: 'pending' });
    const rejectedProperties = await Property.countDocuments({ verificationStatus: 'rejected' });
    
    // Get total users
    const totalUsers = await User.countDocuments();
    const totalAgents = await User.countDocuments({ role: 'agent' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    // Get total wishlist items
    const totalWishlistItems = await Wishlist.countDocuments();
    
    // Get total reviews
    const totalReviews = await Review.countDocuments();
    
         // Get total sold properties and offers statistics
     const totalSoldProperties = await Offer.countDocuments({ status: 'bought' });
     const pendingOffers = await Offer.countDocuments({ status: 'pending' });
     const acceptedOffers = await Offer.countDocuments({ status: 'accepted' });
     const rejectedOffers = await Offer.countDocuments({ status: 'rejected' });
     
     // Calculate total sales amount and get detailed sales data
     const soldOffers = await Offer.find({ status: 'bought' }).populate('propertyId', 'title price priceRange');
    const totalSalesAmount = soldOffers.reduce((total, offer) => total + (offer.offeredAmount || 0), 0);
    
    // Get unique properties that have been sold (to avoid counting multiple offers on same property)
    const soldPropertyIds = [...new Set(soldOffers.map(offer => offer.propertyId?._id?.toString()).filter(Boolean))];
    const uniqueSoldProperties = soldPropertyIds.length;
    
    // Calculate average sale price
    const averageSalePrice = soldOffers.length > 0 ? totalSalesAmount / soldOffers.length : 0;
    
         // Get today's sales
     const today = new Date();
     today.setHours(0, 0, 0, 0);
     const newSalesToday = await Offer.countDocuments({ 
       status: 'bought', 
       createdAt: { $gte: today } 
     });
     
     // Get this month's sales
     const currentMonthStart = new Date();
     currentMonthStart.setDate(1);
     currentMonthStart.setHours(0, 0, 0, 0);
     const newSalesThisMonth = await Offer.countDocuments({ 
       status: 'bought', 
       createdAt: { $gte: currentMonthStart } 
     });
    
    // Get average property price
    const allProperties = await Property.find({ verificationStatus: 'verified' });
    const totalPropertyValue = allProperties.reduce((total, property) => {
      if (property.priceRange) {
        return total + ((property.priceRange.min + property.priceRange.max) / 2);
      } else if (property.price) {
        return total + property.price;
      }
      return total;
    }, 0);
    const averagePropertyPrice = allProperties.length > 0 ? totalPropertyValue / allProperties.length : 0;
    
    // Get recent activity counts (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newPropertiesToday = await Property.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const newReviewsToday = await Review.countDocuments({ reviewTime: { $gte: oneDayAgo } });
    const newOffersToday = await Offer.countDocuments({ createdAt: { $gte: oneDayAgo } });
    
    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const monthlyProperties = [];
    const monthlyUsers = [];
    const monthlyRevenue = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000);
      const monthEnd = new Date(Date.now() - (i - 1) * 30 * 24 * 60 * 60 * 1000);
      
      const propertiesCount = await Property.countDocuments({
        createdAt: { $gte: monthStart, $lt: monthEnd }
      });
      
      const usersCount = await User.countDocuments({
        createdAt: { $gte: monthStart, $lt: monthEnd }
      });
      
             const monthOffers = await Offer.find({
         status: 'bought',
         createdAt: { $gte: monthStart, $lt: monthEnd }
       });
      const monthRevenue = monthOffers.reduce((total, offer) => total + (offer.offeredAmount || 0), 0);
      
      monthlyProperties.push(propertiesCount);
      monthlyUsers.push(usersCount);
      monthlyRevenue.push(monthRevenue);
    }
    
    const statistics = {
      totalProperties,
      verifiedProperties,
      advertisedProperties,
      pendingProperties,
      rejectedProperties,
      totalUsers,
      totalAgents,
      totalAdmins,
      regularUsers,
      totalWishlistItems,
      totalReviews,
      // Sales and offers statistics
      totalSoldProperties,
      uniqueSoldProperties,
      pendingOffers,
      acceptedOffers,
      rejectedOffers,
      totalSalesAmount,
      averageSalePrice,
      newSalesToday,
      newSalesThisMonth,
      averagePropertyPrice,
      // Recent activity
      newPropertiesToday,
      newUsersToday,
      newReviewsToday,
      newOffersToday,
      // Monthly trends
      monthlyProperties,
      monthlyUsers,
      monthlyRevenue
    };
    
    res.json(statistics);
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get real-time statistics for dashboard (lightweight version)
router.get('/statistics/realtime', async (req, res) => {
  try {
    // Get only essential counts for real-time updates
    const totalProperties = await Property.countDocuments();
    const verifiedProperties = await Property.countDocuments({ verificationStatus: 'verified' });
    const totalUsers = await User.countDocuments();
    const totalWishlistItems = await Wishlist.countDocuments();
    const totalReviews = await Review.countDocuments();
         const totalSoldProperties = await Offer.countDocuments({ status: 'bought' });
     
     // Get today's activity
     const today = new Date();
     today.setHours(0, 0, 0, 0);
     const newPropertiesToday = await Property.countDocuments({ createdAt: { $gte: today } });
     const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
     const newReviewsToday = await Review.countDocuments({ reviewTime: { $gte: today } });
     const newSalesToday = await Offer.countDocuments({ 
       status: 'bought', 
       createdAt: { $gte: today } 
     });
    
    const realtimeStats = {
      totalProperties,
      verifiedProperties,
      totalUsers,
      totalWishlistItems,
      totalReviews,
      totalSoldProperties,
      newPropertiesToday,
      newUsersToday,
      newReviewsToday,
      newSalesToday,
      lastUpdated: new Date().toISOString()
    };
    
         res.json(realtimeStats);
   } catch (error) {
     console.error('Get real-time statistics error:', error);
     res.status(500).json({ message: 'Server error' });
   }
 });

// Debug endpoint to check offers data (remove in production)
router.get('/debug/offers', async (req, res) => {
  try {
    const allOffers = await Offer.find().select('status offeredAmount createdAt propertyId');
    const statusCounts = await Offer.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalOffers: allOffers.length,
      statusCounts,
      sampleOffers: allOffers.slice(0, 5)
    });
  } catch (error) {
    console.error('Debug offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
 });

// Get all properties (admin only)
router.get('/properties/all', verifyAdmin, async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Admin get all properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify a property (admin only)
router.patch('/properties/:id/verify', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { verificationStatus: 'verified' },
      { new: true }
    );
    
    res.json({ message: 'Property verified successfully', property: updatedProperty });
  } catch (error) {
    console.error('Admin verify property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject a property (admin only)
router.patch('/properties/:id/reject', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { verificationStatus: 'rejected' },
      { new: true }
    );
    
    res.json({ message: 'Property rejected successfully', property: updatedProperty });
  } catch (error) {
    console.error('Admin reject property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle property advertisement status (admin only)
router.patch('/properties/:id/advertise', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Only verified properties can be advertised
    if (property.verificationStatus !== 'verified') {
      return res.status(400).json({ message: 'Only verified properties can be advertised' });
    }
    
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { isAdvertised: !property.isAdvertised },
      { new: true }
    );
    
    res.json({ 
      message: updatedProperty.isAdvertised ? 'Property is now advertised' : 'Property is no longer advertised',
      property: updatedProperty 
    });
  } catch (error) {
    console.error('Admin advertise property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reviews (admin only)
router.get('/reviews/all', verifyAdmin, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ reviewTime: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Admin get all reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a review (admin only)
router.delete('/reviews/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    await Review.findByIdAndDelete(id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Admin delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Make a user an admin (admin only)
router.patch('/users/:id/make-admin', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: 'admin' },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'User is now an admin', user: updatedUser });
  } catch (error) {
    console.error('Admin make user admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Make a user an agent (admin only)
router.patch('/users/:id/make-agent', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: 'agent' },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'User is now an agent', user: updatedUser });
  } catch (error) {
    console.error('Admin make user agent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user (admin only)
router.delete('/users/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a user as fraud (admin only)
router.patch('/users/:id/mark-fraud', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Only agents can be marked as fraud
    if (user.role !== 'agent') {
      return res.status(400).json({ message: 'Only agents can be marked as fraud' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isFraud: true },
      { new: true }
    ).select('-password');
    
    // Delete all properties associated with the fraudulent agent
    await Property.deleteMany({ agentEmail: user.email });
    
    res.json({ 
      message: 'User marked as fraud and all their properties have been removed',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Admin mark user as fraud error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 