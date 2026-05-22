const express = require('express');
const router = express.Router();
const { getAIChatResponse } = require('../controllers/aiController');

router.post('/chat', getAIChatResponse);

module.exports = router;
