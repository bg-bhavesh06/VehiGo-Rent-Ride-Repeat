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

    const newStart = new Date(pickupDate);
    const newEnd = new Date(returnDate);

    // Fetch all existing active bookings for this vehicle
    const existingBookings = await Booking.find({
      vehicle: vehicleId,
      bookingStatus: { $in: ['Confirmed'] }
    }).sort({ pickupDate: 1 });

    let conflict = false;
    let conflictBooking = null;

    for (let b of existingBookings) {
      const bStart = new Date(b.pickupDate);
      const bEnd = new Date(b.returnDate);

      // ONLY ALLOW BOOKING IF:
      // - New end date is BEFORE or exactly AT booked start date
      // OR
      // - New start date is AFTER or exactly AT booked end date
      const isSafe = (newEnd <= bStart) || (newStart >= bEnd);
      
      if (!isSafe) {
        conflict = true;
        conflictBooking = b;
        break;
      }
    }

    if (conflict) {
      const cStart = new Date(conflictBooking.pickupDate);
      const cEnd = new Date(conflictBooking.returnDate);
      
      const beforeDate = new Date(cStart);
      beforeDate.setDate(beforeDate.getDate() - 1);
      
      const afterDate = new Date(cEnd);
      afterDate.setDate(afterDate.getDate() + 1);

      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      
      return res.status(409).json({
        message: 'Conflict',
        conflictDetails: {
          conflictStart: cStart,
          conflictEnd: cEnd,
          availableBefore: beforeDate,
          availableAfter: afterDate,
          smartMessage: `Sorry! This vehicle is already booked from ${cStart.toLocaleDateString('en-US', options)} to ${cEnd.toLocaleDateString('en-US', options)}.\n\nYou can book:\n✅ Before conflict — upto ${beforeDate.toLocaleDateString('en-US', options)}\n✅ After conflict — from ${afterDate.toLocaleDateString('en-US', options)} onwards`
        }
      });
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
      pickupDate: newStart,
      returnDate: newEnd,
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

    // Update ChatRoom if any
    const ChatRoom = require('../models/ChatRoom');
    await ChatRoom.findOneAndUpdate(
      { bookingId: booking._id },
      { 
        isBooked: false, 
        bookingId: null 
      }
    );

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
    await booking.save();

    // Update ChatRoom if cancelled or completed
    if (status === 'Cancelled' || status === 'Completed') {
      const ChatRoom = require('../models/ChatRoom');
      await ChatRoom.findOneAndUpdate(
        { bookingId: booking._id },
        { 
          isBooked: false, 
          bookingId: null 
        }
      );
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get booked dates for a vehicle
// @route   GET /api/bookings/vehicle/:vehicleId/dates
// @access  Public
const getVehicleBookedDates = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const bookings = await Booking.find({
      vehicle: vehicleId,
      bookingStatus: { $in: ['Confirmed'] }
    }).select('pickupDate returnDate -_id');
    
    res.json(bookings);
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
  getVehicleBookedDates,
};
