const express = require('express');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const UserRepo = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Helper: send token response ─────────────────────────────────────────────
// NOTE: returns both `id` (new) and `_id` (alias) so the existing
// React frontend doesn't break if it reads user._id from localStorage.
const sendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:    user.id,
      _id:   user.id,   // backward-compat alias for frontend
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Replaces: User.findOne({ email })
      const existing = await UserRepo.findByEmail(email);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      // Replaces: User.create({ name, email, password })
      // Password hashing happens inside UserRepo.create()
      const user = await UserRepo.create({ name, email, password });
      sendToken(user, 201, res);
    } catch (err) {
      console.error('Register error:', err.message);
      res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // includePassword=true → SELECT includes the password column (for comparison only)
      // Replaces: User.findOne({ email }).select('+password')
      const user = await UserRepo.findByEmail(email, true);

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Replaces: user.matchPassword(password)
      const isMatch = await UserRepo.matchPassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      sendToken(user, 200, res);
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

module.exports = router;
