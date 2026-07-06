// ==========================================
// Authentication & Profile Routes
// ==========================================

const express = require('express');
const router = express.Router();

// Import controllers handling the auth logic
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

// Import authentication check & file upload middlewares
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public authentication endpoints (No auth header required)
router.post('/register', registerUser); // Registers a User or Owner
router.post('/login', loginUser);       // Authenticates email/contact with password
router.post('/forgot-password', forgotPassword); // Sends OTP email to user
router.post('/reset-password', resetPassword);   // Resets password using valid OTP

// Protected profile management endpoints (Require active JWT token)
router.route('/profile')
  .get(protect, getUserProfile) // Fetch logged-in user profile details
  .put(protect, upload.single('avatar'), updateUserProfile); // Update avatar image & profile details

module.exports = router;
