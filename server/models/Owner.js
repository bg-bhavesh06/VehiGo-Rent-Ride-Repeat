const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'Owner',
  },
  avatar: {
    type: String,
    default: '',
  },
  documents: [{
    type: String // URLs for Aadhaar, License etc.
  }],
}, { timestamps: true });

module.exports = mongoose.model('Owner', ownerSchema);
