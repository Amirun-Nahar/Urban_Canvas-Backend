const mongoose = require('mongoose');
const Property = require('./models/Property');
require('dotenv').config();

async function updatePropertyToAdvertised() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update the property to be advertised
    const updatedProperty = await Property.findOneAndUpdate(
      { verificationStatus: 'verified' },
      { isAdvertised: true },
      { new: true }
    );

    if (updatedProperty) {
      console.log('Successfully updated property to be advertised:');
      console.log('Title:', updatedProperty.title);
      console.log('Location:', updatedProperty.location);
      console.log('isAdvertised:', updatedProperty.isAdvertised);
    } else {
      console.log('No verified property found to update');
    }

  } catch (error) {
    console.error('Error updating property:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updatePropertyToAdvertised(); 