const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

const getOwnerChatRooms = async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({ ownerId: req.user._id })
        .populate('vehicleId', 'name images')
        .populate('bookingId', 'pickupDate returnDate bookingStatus')
        .sort({ lastMessageTime: -1 });
    res.json(chatRooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserChatRooms = async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({ userId: req.user._id })
        .populate('vehicleId', 'name images')
        .populate('ownerId', 'name email')
        .populate('bookingId', 'pickupDate returnDate bookingStatus')
        .sort({ lastMessageTime: -1 });
    res.json(chatRooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Booking = require('../models/Booking');

const startOrGetChatRoom = async (req, res) => {
  try {
    const { vehicleId, ownerId } = req.body;
    const userId = req.user._id;

    // Check for an active booking
    const activeBooking = await Booking.findOne({
      user: userId,
      vehicle: vehicleId,
      bookingStatus: { $in: ['Confirmed'] }
    });

    const isBooked = !!activeBooking;
    const bookingId = activeBooking ? activeBooking._id : null;

    let chatRoom = await ChatRoom.findOne({ vehicleId, userId });

    if (!chatRoom) {
      // Find user details to populate
      const user = await User.findById(userId);
      chatRoom = await ChatRoom.create({
        vehicleId,
        ownerId,
        userId,
        userName: user.name,
        userContact: user.contactNumber || user.email,
        userEmail: user.email,
        bookingId: bookingId,
        isBooked: isBooked
      });
    } else {
      // Update booking status
      let shouldSave = false;
      if (chatRoom.isBooked !== isBooked) {
        chatRoom.isBooked = isBooked;
        shouldSave = true;
      }
      if (chatRoom.bookingId?.toString() !== bookingId?.toString()) {
        chatRoom.bookingId = bookingId;
        shouldSave = true;
      }
      if (shouldSave) await chatRoom.save();
    }

    res.json(chatRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatroomId: req.params.roomId }).sort({ createdAt: 1 });
    
    // reset unread count
    const chatRoom = await ChatRoom.findById(req.params.roomId);
    if (chatRoom) {
      let shouldSave = false;
      if (chatRoom.ownerId.toString() === req.user._id.toString()) {
        chatRoom.unreadCount = 0;
        shouldSave = true;
      }
      if (chatRoom.userId.toString() === req.user._id.toString()) {
        chatRoom.userUnreadCount = 0;
        shouldSave = true;
      }
      if (shouldSave) await chatRoom.save();
    }

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveMessage = async (req, res) => {
  try {
    const { chatroomId, receiverId, messageText, imageUrl } = req.body;
    const senderId = req.user._id;

    const message = await Message.create({
      chatroomId,
      senderId,
      receiverId,
      messageText,
      imageUrl
    });

    const chatroom = await ChatRoom.findById(chatroomId);
    let incOwnerUnread = 0;
    let incUserUnread = 0;

    // Increment unread count for owner if user sends message
    if (receiverId.toString() === chatroom.ownerId.toString()) {
      incOwnerUnread = 1;
    }
    // Increment unread count for user if owner sends message
    if (receiverId.toString() === chatroom.userId.toString()) {
      incUserUnread = 1;
    }

    // Update last message in chatroom
    await ChatRoom.findByIdAndUpdate(chatroomId, {
      lastMessage: messageText || 'Image',
      lastMessageTime: Date.now(),
      $inc: { unreadCount: incOwnerUnread, userUnreadCount: incUserUnread }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markRoomAsRead = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.roomId);
    if (chatRoom) {
      let shouldSave = false;
      if (chatRoom.ownerId.toString() === req.user._id.toString()) {
        chatRoom.unreadCount = 0;
        shouldSave = true;
      }
      if (chatRoom.userId.toString() === req.user._id.toString()) {
        chatRoom.userUnreadCount = 0;
        shouldSave = true;
      }
      if (shouldSave) await chatRoom.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOwnerChatRooms,
  getUserChatRooms,
  startOrGetChatRoom,
  getChatMessages,
  saveMessage,
  markRoomAsRead
};
