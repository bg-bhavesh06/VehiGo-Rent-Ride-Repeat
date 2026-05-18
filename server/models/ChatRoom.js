const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userContact: { type: String, required: true },
  userEmail: { type: String, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  isBooked: { type: Boolean, default: false },
  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 },
  userUnreadCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
