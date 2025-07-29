const express = require('express');
const multer = require('multer');
const { verifyToken, isAdmin, isAgent } = require('../middleware/auth');
const {
  getAllProperties,
  getAdvertisedProperties,
  getProperty,
  addProperty,
  updateProperty,
  deleteProperty,
  verifyProperty,
  toggleAdvertisement
} = require('../controllers/propertyController');

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Public routes
router.get('/', getAllProperties);
router.get('/advertised', getAdvertisedProperties);
router.get('/:id', getProperty);

// Protected routes
router.use(verifyToken);

// Agent routes
router.post('/', isAgent, upload.single('image'), addProperty);
router.put('/:id', isAgent, upload.single('image'), updateProperty);
router.delete('/:id', isAgent, deleteProperty);

// Admin routes
router.patch('/:id/verify', isAdmin, verifyProperty);
router.patch('/:id/advertise', isAdmin, toggleAdvertisement);

module.exports = router; 