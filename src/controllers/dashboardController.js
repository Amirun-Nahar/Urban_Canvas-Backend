const User = require('../models/User');
const Property = require('../models/Property');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get counts based on user role
    const stats = {
      wishlistCount: await Wishlist.countDocuments({ user: userId }),
      reviewsCount: await Review.countDocuments({ user: userId }),
      propertiesCount: 0,
      messagesCount: 0 // Placeholder for future message feature
    };

    // Get properties count for agents and admins
    if (['agent', 'admin'].includes(req.user.role)) {
      stats.propertiesCount = await Property.countDocuments(
        req.user.role === 'admin' ? {} : { agent: userId }
      );
    }

    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error getting dashboard statistics' });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const activities = [];

    // Get recent reviews
    const recentReviews = await Review.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('property', 'title');

    activities.push(...recentReviews.map(review => ({
      _id: review._id,
      title: 'Property Review',
      description: `You reviewed ${review.property.title}`,
      createdAt: review.createdAt,
      link: `/properties/${review.property._id}`
    })));

    // Get recent wishlists
    const recentWishlists = await Wishlist.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('property', 'title');

    activities.push(...recentWishlists.map(wishlist => ({
      _id: wishlist._id,
      title: 'Added to Wishlist',
      description: `You added ${wishlist.property.title} to your wishlist`,
      createdAt: wishlist.createdAt,
      link: `/properties/${wishlist.property._id}`
    })));

    // Get recent properties for agents
    if (['agent', 'admin'].includes(req.user.role)) {
      const recentProperties = await Property.find(
        req.user.role === 'admin' ? {} : { agent: userId }
      )
        .sort({ createdAt: -1 })
        .limit(3);

      activities.push(...recentProperties.map(property => ({
        _id: property._id,
        title: 'Property Listed',
        description: `You listed ${property.title}`,
        createdAt: property.createdAt,
        link: `/properties/${property._id}`
      })));
    }

    // Sort all activities by date
    activities.sort((a, b) => b.createdAt - a.createdAt);

    res.json(activities.slice(0, 5)); // Return only the 5 most recent activities
  } catch (error) {
    console.error('Error getting recent activities:', error);
    res.status(500).json({ message: 'Error getting recent activities' });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivities
}; 