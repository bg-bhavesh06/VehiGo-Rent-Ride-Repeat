const express = require('express');
const router = express.Router();
const {
  addVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getOwnerVehicles,
  getVehicleCities,
} = require('../controllers/vehicleController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getVehicles)
  .post(protect, ownerOnly, upload.array('images'), addVehicle);

router.route('/cities')
  .get(getVehicleCities);

router.route('/owner')
  .get(protect, ownerOnly, getOwnerVehicles);

router.route('/:id')
  .get(getVehicleById)
  .put(protect, ownerOnly, updateVehicle)
  .delete(protect, ownerOnly, deleteVehicle);

module.exports = router;
