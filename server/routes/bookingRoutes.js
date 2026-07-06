// ==========================================
// Vehicle Booking Routes
// ==========================================

const express = require('express');
const router = express.Router();

// Import controllers handling the booking logic
const {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  cancelBooking,
  updateBookingStatus,
  getVehicleBookedDates,
} = require('../controllers/bookingController');

// Import authentication check & role protection middlewares
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Bookings collection endpoints
router.route('/')
  // POST: Create a new booking. Requires verification documents (max 3 files).
  .post(protect, upload.array('documents', 3), createBooking);

// Fetch bookings list for the logged-in User
router.get('/user', protect, getUserBookings);

// Fetch bookings list for the logged-in Owner (vehicles owned by them)
router.get('/owner', protect, ownerOnly, getOwnerBookings);

// Fetch booked/busy intervals for a specific vehicle (Public/unauthenticated route)
router.get('/vehicle/:vehicleId/dates', getVehicleBookedDates);

// Cancel an existing booking (Can be initiated by User or Owner)
router.put('/:id/cancel', protect, cancelBooking);

// Update status of booking (Approve/Reject - Owner Only endpoint)
router.put('/:id/status', protect, ownerOnly, updateBookingStatus);

module.exports = router;
