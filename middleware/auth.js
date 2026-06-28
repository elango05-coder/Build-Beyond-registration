const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Middleware to protect routes (Authentication)
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Check for token in cookies (optional fallback for secure clients)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401);
      return next(new Error('Not authorized: no token provided. Please log in.'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey123!@#');

    // Find user/admin in database based on payload type
    let currentUser;
    if (decoded.type === 'admin') {
      currentUser = await Admin.findById(decoded.id);
    } else {
      currentUser = await User.findById(decoded.id);
    }

    if (!currentUser) {
      res.status(401);
      return next(new Error('The user belonging to this token no longer exists.'));
    }

    // Grant access and expose user object
    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401);
    next(error);
  }
};

// Middleware to restrict access to specific roles (Authorization)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('Access denied: you do not have permission to perform this action.'));
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
