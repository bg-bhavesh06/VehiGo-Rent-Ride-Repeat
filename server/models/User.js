const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  role: {
    type: String,
    enum: ['User', 'Owner'],
    default: 'User',
  },
  avatar: {
    type: String,
    default: '',
  },
  documents: [{
    type: String // URLs for Aadhaar, License etc.
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
