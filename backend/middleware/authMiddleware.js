const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT and attach user
const verifyToken = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_bcsp064_ignou_2026');

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no bearer token supplied' });
  }
};

// Middleware to restrict access to Admins only
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden: Requires Administrator privileges' });
};

// Middleware to ensure student is approved and has semester assigned before sitting for exams
const requireApprovedStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    if (!req.user.isApproved || !req.user.semester) {
      return res.status(403).json({
        success: false,
        message: 'Your admission is currently pending verification. You will be able to take exams once an administrator approves your enrolment and assigns your semester.',
      });
    }
  }
  next();
};

module.exports = { verifyToken, requireAdmin, requireApprovedStudent };
