const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Owner = require('../models/Owner');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user = await User.findById(decoded.id).select('-password');
      if (!user) {
        user = await Owner.findById(decoded.id).select('-password');
      }
      req.user = user;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const ownerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Owner') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an Owner' });
  }
};

module.exports = { protect, ownerOnly };
