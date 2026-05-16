const express = require('express');
const router = express.Router();
const { getOwnerChatRooms, startOrGetChatRoom, getChatMessages, saveMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/owner', protect, getOwnerChatRooms);
router.post('/room', protect, startOrGetChatRoom);
router.get('/room/:roomId/messages', protect, getChatMessages);
router.post('/message', protect, saveMessage);

module.exports = router;
