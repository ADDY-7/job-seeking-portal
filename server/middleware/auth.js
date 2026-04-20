const jwt = require('jsonwebtoken');
const UserRepo = require('../models/User');

// ─── protect middleware ───────────────────────────────────────────────────────
// Verifies the Bearer JWT and attaches req.user (without password).
// Replaces: User.findById(decoded.id).select('-password')  →  UserRepo.findById()

const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized – no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // findById never returns the password column
    req.user = await UserRepo.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// ─── authorize middleware ─────────────────────────────────────────────────────
// Restricts access to specific roles (unchanged logic).
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
