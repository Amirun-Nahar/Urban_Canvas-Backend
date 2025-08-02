const mongoose = require('mongoose');
const Review = require('./models/Review');
require('dotenv').config();

const sampleReviews = [
  {
    propertyId: "688d0f45562b5c8cdcc69e0b",
    propertyTitle: "Luxurious 4-Bedroom Apartment with Lake View",
    reviewerName: "Sarah Johnson",
    reviewerEmail: "sarah.j@example.com",
    reviewerImage: "https://i.ibb.co/MBtjqXQ/no-avatar.gif",
    reviewDescription: "The apartment exceeded our expectations! The lake view is breathtaking, and the modern amenities make daily life so convenient. The security system gives us peace of mind, and the community is very welcoming.",
    reviewTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    propertyId: "688d0f45562b5c8cdcc69e0b",
    propertyTitle: "Luxurious 4-Bedroom Apartment with Lake View",
    reviewerName: "Michael Chen",
    reviewerEmail: "m.chen@example.com",
    reviewerImage: "https://i.ibb.co/MBtjqXQ/no-avatar.gif",
    reviewDescription: "As a real estate investor, I'm impressed by the property's build quality and attention to detail. The location is prime, and the potential for value appreciation is significant. The management team has been very professional throughout the process.",
    reviewTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  }
];

async function createSampleReviews() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create reviews
    const createdReviews = await Review.create(sampleReviews);
    console.log('Created sample reviews:', createdReviews);

  } catch (error) {
    console.error('Error creating sample reviews:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSampleReviews(); 