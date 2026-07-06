// ==========================================
// Vehicle Catalog & Management Routes
// ==========================================

const express = require('express');
const router = express.Router();

// Import controllers handling the vehicle logic
const {
  addVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getOwnerVehicles,
  getVehicleCities,
} = require('../controllers/vehicleController');

// Import authentication check & role protection middlewares
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Vehicles catalog endpoint
router.route('/')
  .get(getVehicles) // GET: Public access to fetch all vehicles (with filters like price, type, location)
  .post(protect, ownerOnly, upload.array('images'), addVehicle); // POST: Owner only endpoint to register a new vehicle with image uploads

// Get list of unique cities where vehicles are currently registered
router.route('/cities')
  .get(getVehicleCities);

// Get all vehicles registered by the logged-in Owner
router.route('/owner')
  .get(protect, ownerOnly, getOwnerVehicles);

// Vehicle CRUD endpoints by ID
router.route('/:id')
  .get(getVehicleById) // GET: Public access to view detailed specs & details of a single vehicle
  .put(protect, ownerOnly, updateVehicle) // PUT: Update details (price, details, availability status) of owned vehicle
  .delete(protect, ownerOnly, deleteVehicle); // DELETE: Deregister/remove a vehicle from the system

module.exports = router;
