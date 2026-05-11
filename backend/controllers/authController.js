const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc   Register new user
// @route  POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(409).json({ message: 'Username or email already in use' });
    }

    // Only allow self-registration as player or spectator. Admin must be promoted
    // out-of-band (see README). This prevents privilege escalation via the API.
    const safeRole = role && ['player', 'spectator'].includes(role) ? role : 'player';

    const user = await User.create({
      username,
      email,
      password,
      role: safeRole,
    });

    return res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      wins: user.wins,
      losses: user.losses,
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc   Login user
// @route  POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      // Use a single generic message to avoid user-enumeration.
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      wins: user.wins,
      losses: user.losses,
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc   Get current authenticated user
// @route  GET /api/auth/me
exports.getMe = async (req, res) => {
  return res.json(req.user);
};

// Exported for tests
exports._generateToken = generateToken;
