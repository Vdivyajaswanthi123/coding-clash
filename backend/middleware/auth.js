const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT auth middleware. Attaches the user document (minus password) to `req.user`.
 * 401 if the header is missing or the token is invalid / user no longer exists.
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

/**
 * Role guard factory. Returns middleware that only lets a user through if their
 * role is in `allowed`. Centralising this means every route declares its own
 * access policy explicitly (no scattered ad-hoc checks inside controllers).
 *
 *   router.post('/foo', protect, requireRole('admin'), handler);
 *   router.post('/bar', protect, requireRole('admin', 'player'), handler);
 */
const requireRole = (...allowed) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      message: `Forbidden — requires one of: ${allowed.join(', ')}`,
    });
  }
  return next();
};

// Convenience shortcuts (kept for backwards compatibility)
const adminOnly = requireRole('admin');
const playerOnly = requireRole('player', 'admin'); // admin can also act as a player
const spectatorOrAbove = requireRole('admin', 'player', 'spectator');

module.exports = {
  protect,
  requireRole,
  adminOnly,
  playerOnly,
  spectatorOrAbove,
};
