const mongoose = require('mongoose');
require('dotenv').config();

const fixSchema = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all indexes
    console.log('Current indexes:');
    const indexes = await collection.indexes();
    console.log(indexes);

    // Drop the problematic uid index if it exists
    try {
      await collection.dropIndex('uid_1');
      console.log('Dropped uid_1 index');
    } catch (error) {
      console.log('No uid_1 index found or error dropping index:', error.message);
    }

    // List indexes again to confirm
    console.log('\nRemaining indexes:');
    const remainingIndexes = await collection.indexes();
    console.log(remainingIndexes);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixSchema(); 