const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  pickupDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Completed', 'Failed'],
    default: 'Pending'
  },
  bookingStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  documents: [{ type: String }], // Optional: documents specifically uploaded for this booking
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
