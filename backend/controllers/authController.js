const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate signed JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET || 'supersecretjwtkey_bcsp064_ignou_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    }
  );
};

// @desc   Register new candidate/student
// @route  POST /api/auth/register
// @access Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, enrolmentNo, course } = req.body;

    if (!name || !email || !password || !course) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and course' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists' });
    }

    // New student registration: Semester is unassigned (null) and status is pending (false)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'student',
      enrolmentNo: enrolmentNo ? enrolmentNo.trim() : '',
      course: course ? course.trim() : 'BCA',
      semester: null, // Admin will assign semester upon approval!
      isApproved: false, // Default is pending approval!
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Your admission is pending verification by the administration.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrolmentNo: user.enrolmentNo,
        course: user.course,
        semester: user.semester,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
};

// @desc   Authenticate user & return token
// @route  POST /api/auth/login
// @access Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrolmentNo: user.enrolmentNo,
        course: user.course,
        semester: user.semester,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// @desc   Get current logged-in user profile
// @route  GET /api/auth/me
// @access Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user profile', error: error.message });
  }
};
