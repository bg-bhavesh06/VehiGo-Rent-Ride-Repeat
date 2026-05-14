const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  type: { type: String, required: true }, // Bike, Car, SUV, etc.
  model: { type: String, required: true },
  vehicleNumber: { type: String, required: true, unique: true },
  fuelType: { type: String, required: true },
  seatingCapacity: { type: Number, required: true },
  pricePerHour: { type: Number, required: true },
  location: { type: String, required: true },
  description: { type: String },
  availabilityStatus: { type: Boolean, default: true },
  images: [{ type: String }], // Cloudinary URLs
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
