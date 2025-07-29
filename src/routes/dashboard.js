const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getDashboardStats, getRecentActivities } = require('../controllers/dashboardController');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', verifyToken, getDashboardStats);

// Get recent activities
router.get('/activities', verifyToken, getRecentActivities);

module.exports = router; 