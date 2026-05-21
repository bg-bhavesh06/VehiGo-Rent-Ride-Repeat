const Vehicle = require('../models/Vehicle');
const cloudinary = require('../config/cloudinary');

// Helper to upload buffer to cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'bike_rental/vehicles' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// @desc    Add new vehicle
// @route   POST /api/vehicles
// @access  Private/Owner
const addVehicle = async (req, res) => {
  try {
    const { name, brand, type, model, vehicleNumber, fuelType, seatingCapacity, pricePerHour, location, description, latitude, longitude } = req.body;

    const vehicleExists = await Vehicle.findOne({ vehicleNumber });
    if (vehicleExists) {
      return res.status(400).json({ message: 'Vehicle with this number already exists' });
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        imageUrls.push(url);
      }
    }

    const vehicle = await Vehicle.create({
      name,
      brand,
      type,
      model,
      vehicleNumber,
      fuelType,
      seatingCapacity,
      pricePerHour,
      location,
      description,
      latitude: Number(latitude),
      longitude: Number(longitude),
      locationCoordinates: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      },
      images: imageUrls,
      owner: req.user._id,
    });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all vehicles (with filters)
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
  try {
    const { type, location, lat, lon, brand, maxPrice, minPrice } = req.query;
    
    let query = {};

    if (lat && lon) {
      query.locationCoordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lon), Number(lat)]
          },
          $maxDistance: 10000 // 10 km in meters
        }
      };
    } else if (location) {
      query.location = new RegExp(location, 'i');
    }

    if (type) query.type = new RegExp(type, 'i');
    if (brand) query.brand = new RegExp(brand, 'i');
    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
    }

    const vehicles = await Vehicle.find(query).populate('owner', 'name email').lean();
    
    const Booking = require('../models/Booking');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let vehicle of vehicles) {
      const activeBookings = await Booking.find({
        vehicle: vehicle._id,
        bookingStatus: { $in: ['Pending', 'Confirmed'] },
        returnDate: { $gte: today }
      }).select('pickupDate returnDate').sort({ pickupDate: 1 });
      
      vehicle.activeBookings = activeBookings;
    }

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'name email');
    
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private/Owner
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Ensure the user is the owner
    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this vehicle' });
    }

    const updateData = { ...req.body };
    if (updateData.latitude && updateData.longitude) {
      updateData.latitude = Number(updateData.latitude);
      updateData.longitude = Number(updateData.longitude);
      updateData.locationCoordinates = {
        type: 'Point',
        coordinates: [updateData.longitude, updateData.latitude]
      };
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private/Owner
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this vehicle' });
    }

    await Vehicle.deleteOne({ _id: vehicle._id });
    res.json({ message: 'Vehicle removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get owner's vehicles
// @route   GET /api/vehicles/owner
// @access  Private/Owner
const getOwnerVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id }).sort({ createdAt: -1 }).lean();
    
    const Booking = require('../models/Booking');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let vehicle of vehicles) {
      const activeBookings = await Booking.find({
        vehicle: vehicle._id,
        bookingStatus: { $in: ['Pending', 'Confirmed'] },
        returnDate: { $gte: today }
      }).select('pickupDate returnDate').sort({ pickupDate: 1 });
      
      vehicle.activeBookings = activeBookings;
    }

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unique cities where vehicles are available
// @route   GET /api/vehicles/cities
// @access  Public
const getVehicleCities = async (req, res) => {
  try {
    const cities = await Vehicle.distinct('location', { availabilityStatus: true });
    
    // The locations might be full addresses like "Waghodiya, Vadodara, Gujarat"
    // For city suggestions, we might just return the raw distinct locations or process them.
    // The user instruction: "City suggestions ONLY from cities where vehicles actually exist in MongoDB"
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getOwnerVehicles,
  getVehicleCities,
};
