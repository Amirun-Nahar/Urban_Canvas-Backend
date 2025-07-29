const Property = require('../models/Property');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Get all properties with filters and pagination
const getAllProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = '-createdAt',
      location,
      minPrice,
      maxPrice,
      propertyType,
      verificationStatus = 'verified'
    } = req.query;

    // Build query
    const query = { verificationStatus };
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (minPrice || maxPrice) {
      query.priceRange = {};
      if (minPrice) query.priceRange.$gte = Number(minPrice);
      if (maxPrice) query.priceRange.$lte = Number(maxPrice);
    }
    
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Execute query with pagination
    const properties = await Property.find(query)
      .populate('agent', 'name email image')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total documents
    const count = await Property.countDocuments(query);

    res.json({
      properties,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProperties: count
    });
  } catch (error) {
    console.error('Error getting properties:', error);
    res.status(500).json({ message: 'Error getting properties' });
  }
};

// Get advertised properties
const getAdvertisedProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      isAdvertised: true,
      verificationStatus: 'verified'
    })
      .populate('agent', 'name email image')
      .sort('-createdAt')
      .limit(8);

    res.json(properties);
  } catch (error) {
    console.error('Error getting advertised properties:', error);
    res.status(500).json({ message: 'Error getting advertised properties' });
  }
};

// Get single property
const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('agent', 'name email image')
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'name image'
        }
      });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json({ message: 'Error getting property' });
  }
};

// Add new property
const addProperty = async (req, res) => {
  try {
    const { title, location, priceRange, description, propertyType, area, bedrooms, bathrooms, yearBuilt, features } = req.body;
    
    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);

    const property = new Property({
      title,
      location,
      image: result.secure_url,
      agent: req.user._id,
      priceRange: {
        min: Number(priceRange.min),
        max: Number(priceRange.max)
      },
      description,
      propertyType,
      area: Number(area),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      yearBuilt: Number(yearBuilt),
      features: JSON.parse(features)
    });

    await property.save();
    res.status(201).json(property);
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).json({ message: 'Error adding property' });
  }
};

// Update property
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!property.isOwner(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Reset verification status if important details are changed
    if (req.body.priceRange || req.body.location || req.body.title) {
      req.body.verificationStatus = 'pending';
    }

    // Upload new image if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      req.body.image = result.secure_url;
    }

    // Update property
    Object.assign(property, req.body);
    await property.save();

    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ message: 'Error updating property' });
  }
};

// Delete property
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!property.isOwner(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await property.remove();
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: 'Error deleting property' });
  }
};

// Verify property (admin only)
const verifyProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    property.verificationStatus = req.body.status;
    await property.save();

    res.json(property);
  } catch (error) {
    console.error('Error verifying property:', error);
    res.status(500).json({ message: 'Error verifying property' });
  }
};

// Toggle property advertisement (admin only)
const toggleAdvertisement = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.verificationStatus !== 'verified') {
      return res.status(400).json({ message: 'Only verified properties can be advertised' });
    }

    property.isAdvertised = !property.isAdvertised;
    await property.save();

    res.json(property);
  } catch (error) {
    console.error('Error toggling advertisement:', error);
    res.status(500).json({ message: 'Error toggling advertisement' });
  }
};

module.exports = {
  getAllProperties,
  getAdvertisedProperties,
  getProperty,
  addProperty,
  updateProperty,
  deleteProperty,
  verifyProperty,
  toggleAdvertisement
}; 