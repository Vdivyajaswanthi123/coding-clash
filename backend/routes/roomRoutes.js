const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRooms,
  getRoom,
  joinRoom,
  submitCode,
  deleteRoom,
} = require('../controllers/roomController');
const { protect, requireRole } = require('../middleware/auth');
const { submitLimiter } = require('../middleware/rateLimit');
const {
  validate,
  createRoomSchema,
  joinRoomSchema,
  submitCodeSchema,
} = require('../middleware/validate');

// Read endpoints — any authenticated user (admin, player, spectator)
router.get('/', protect, requireRole('admin', 'player', 'spectator'), getRooms);
router.get('/:code', protect, requireRole('admin', 'player', 'spectator'), getRoom);

// Room management — admin only
router.post('/', protect, requireRole('admin'), validate(createRoomSchema), createRoom);
router.delete('/:code', protect, requireRole('admin'), deleteRoom);

// Joining — anyone authenticated. The controller still enforces capacity rules.
router.post(
  '/:code/join',
  protect,
  requireRole('admin', 'player', 'spectator'),
  validate(joinRoomSchema),
  joinRoom
);

// Code submission — players only (admin allowed for testing). Rate limited.
router.post(
  '/:code/submit',
  protect,
  requireRole('player', 'admin'),
  submitLimiter,
  validate(submitCodeSchema),
  submitCode
);

module.exports = router;
