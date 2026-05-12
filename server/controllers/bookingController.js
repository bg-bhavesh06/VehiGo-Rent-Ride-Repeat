const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const cloudinary = require('../config/cloudinary');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private/User
const createBooking = async (req, res) => {
  try {
    const { vehicleId, pickupDate, returnDate, totalAmount } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (!vehicle.availabilityStatus) {
      return res.status(400).json({ message: 'Vehicle is currently unavailable' });
    }

    let documentUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'bike_rental/documents' },
          (error, result) => {
            if (!error && result) {
              documentUrls.push(result.secure_url);
            }
          }
        );
        uploadStream.end(file.buffer);
      }
    }

    // Advance payment is 50%
    const advanceAmount = totalAmount / 2;
    const remainingAmount = totalAmount - advanceAmount;

    const booking = await Booking.create({
      user: req.user._id,
      vehicle: vehicleId,
      owner: vehicle.owner,
      pickupDate,
      returnDate,
      totalAmount,
      remainingAmount,
      documents: documentUrls,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's bookings
// @route   GET /api/bookings/user
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('vehicle', 'name brand images vehicleNumber')
      .populate('owner', 'name email');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get owner's bookings
// @route   GET /api/bookings/owner
// @access  Private/Owner
const getOwnerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user._id })
      .populate('vehicle', 'name brand images vehicleNumber')
      .populate('user', 'name email');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (User or Owner)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is the one who booked or the owner of the vehicle
    if (booking.user.toString() !== req.user._id.toString() && booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.bookingStatus = 'Cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (Owner only)
// @route   PUT /api/bookings/:id/status
// @access  Private/Owner
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.bookingStatus = status;
    
    // If completed, maybe free up vehicle, etc.

    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  cancelBooking,
  updateBookingStatus,
};
