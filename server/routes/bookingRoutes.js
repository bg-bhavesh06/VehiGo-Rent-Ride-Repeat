const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  cancelBooking,
  updateBookingStatus,
  getVehicleBookedDates,
} = require('../controllers/bookingController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.array('documents', 3), createBooking);

router.get('/user', protect, getUserBookings);
router.get('/owner', protect, ownerOnly, getOwnerBookings);
router.get('/vehicle/:vehicleId/dates', getVehicleBookedDates);

router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/status', protect, ownerOnly, updateBookingStatus);

module.exports = router;
