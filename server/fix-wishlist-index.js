const mongoose = require('mongoose');
require('dotenv').config();

async function fixWishlistIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the database instance
    const db = mongoose.connection.db;
    
    // Drop the old incorrect index
    try {
      await db.collection('wishlists').dropIndex('user_1_property_1');
      console.log('Dropped old index: user_1_property_1');
    } catch (error) {
      console.log('Old index not found or already dropped');
    }

    // Create the correct index
    await db.collection('wishlists').createIndex(
      { userEmail: 1, propertyId: 1 }, 
      { unique: true, name: 'userEmail_1_propertyId_1' }
    );
    console.log('Created new index: userEmail_1_propertyId_1');

    console.log('Wishlist index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing wishlist index:', error);
    process.exit(1);
  }
}

fixWishlistIndex(); 