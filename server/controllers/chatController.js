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

const startOrGetChatRoom = async (req, res) => {
  try {
    const { vehicleId, ownerId, bookingId, isBooked } = req.body;
    const userId = req.user._id;

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
        bookingId: bookingId || null,
        isBooked: isBooked || false
      });
    } else {
      // Update booking status if changed
      let shouldSave = false;
      if (isBooked !== undefined && chatRoom.isBooked !== isBooked) {
        chatRoom.isBooked = isBooked;
        shouldSave = true;
      }
      if (bookingId && chatRoom.bookingId?.toString() !== bookingId) {
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
    
    // reset unread count when messages are fetched by receiver (optional)
    // we'll keep it simple for now

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

    // Update last message in chatroom
    await ChatRoom.findByIdAndUpdate(chatroomId, {
      lastMessage: messageText || 'Image',
      lastMessageTime: Date.now(),
      $inc: { unreadCount: req.user._id.toString() !== receiverId.toString() ? 1 : 0 }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOwnerChatRooms,
  startOrGetChatRoom,
  getChatMessages,
  saveMessage
};
