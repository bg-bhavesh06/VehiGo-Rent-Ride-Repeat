const express = require('express');
const router = express.Router();
const { getOwnerChatRooms, getUserChatRooms, startOrGetChatRoom, getChatMessages, saveMessage, markRoomAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/owner', protect, getOwnerChatRooms);
router.get('/user', protect, getUserChatRooms);
router.post('/room', protect, startOrGetChatRoom);
router.get('/room/:roomId/messages', protect, getChatMessages);
router.post('/message', protect, saveMessage);
router.put('/room/:roomId/read', protect, markRoomAsRead);

module.exports = router;
