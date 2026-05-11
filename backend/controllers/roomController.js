const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const User = require('../models/User');
const { evaluateCode, generateCommentary } = require('../services/aiJudge');

/* ----------------------------- Pure helpers ---------------------------- */

/**
 * Generates a unique-ish 8-character uppercase room code. Exposed for tests.
 * (Collisions are vanishingly rare at our scale; the DB has no unique constraint
 *  on roomCode by design so we can regenerate on the rare collision.)
 */
function generateRoomCode() {
  return uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
}

/**
 * Given an array of {player, accuracy} submissions, returns the playerId of the
 * winner (highest accuracy; first-submitted wins on a tie). Exposed for tests.
 */
function decideWinner(submissions) {
  if (!submissions || submissions.length === 0) return null;
  const sorted = [...submissions].sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return new Date(a.submittedAt) - new Date(b.submittedAt);
  });
  return sorted[0].player;
}

/* ------------------------------ Endpoints ------------------------------ */

// @desc   Create new room (admin only)
// @route  POST /api/rooms
exports.createRoom = async (req, res) => {
  try {
    const { title, problemStatement, difficulty, timeLimit } = req.body;
    const room = await Room.create({
      roomCode: generateRoomCode(),
      title,
      problemStatement,
      difficulty,
      timeLimit,
      createdBy: req.user._id,
    });
    return res.status(201).json(room);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc   Get all rooms (paginated)
// @route  GET /api/rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('createdBy', 'username')
      .populate('players', 'username')
      .populate('winner', 'username')
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json(rooms);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc   Get single room by code
// @route  GET /api/rooms/:code
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.code })
      .populate('createdBy', 'username')
      .populate('players', 'username')
      .populate('spectators', 'username')
      .populate('winner', 'username')
      .populate('submissions.player', 'username');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    return res.json(room);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc   Join room as player or spectator
// @route  POST /api/rooms/:code/join
exports.joinRoom = async (req, res) => {
  try {
    const { mode } = req.body;
    const room = await Room.findOne({ roomCode: req.params.code });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const userId = req.user._id.toString();

    if (mode === 'spectator') {
      if (!room.spectators.map((s) => s.toString()).includes(userId)) {
        room.spectators.push(req.user._id);
      }
    } else {
      if (room.status !== 'waiting') {
        return res.status(400).json({ message: 'Match already started or finished' });
      }
      if (room.players.length >= room.maxPlayers) {
        return res.status(400).json({ message: 'Room is full' });
      }
      if (!room.players.map((p) => p.toString()).includes(userId)) {
        room.players.push(req.user._id);
      }
      if (room.players.length === room.maxPlayers) {
        room.status = 'in-progress';
        room.startedAt = new Date();
      }
    }
    await room.save();
    const populated = await Room.findById(room._id)
      .populate('players', 'username')
      .populate('spectators', 'username');
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc   Submit code for AI evaluation
// @route  POST /api/rooms/:code/submit
exports.submitCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const room = await Room.findOne({ roomCode: req.params.code });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status === 'completed') {
      return res.status(400).json({ message: 'Match already completed' });
    }

    const playerId = req.user._id.toString();
    if (!room.players.map((p) => p.toString()).includes(playerId)) {
      return res.status(403).json({ message: 'You are not a player in this room' });
    }

    // AI evaluation
    const { accuracy, feedback } = await evaluateCode(
      room.problemStatement,
      code,
      language
    );

    // Replace any previous submission by the same player
    room.submissions = room.submissions.filter(
      (s) => s.player.toString() !== playerId
    );
    room.submissions.push({
      player: req.user._id,
      code,
      language,
      accuracy,
      feedback,
      submittedAt: new Date(),
    });

    // If everyone submitted, decide winner
    if (room.submissions.length === room.players.length) {
      const winnerId = decideWinner(room.submissions);
      room.winner = winnerId;
      room.status = 'completed';
      room.endedAt = new Date();

      await User.findByIdAndUpdate(winnerId, { $inc: { wins: 1 } });
      for (const sub of room.submissions) {
        if (sub.player.toString() !== winnerId.toString()) {
          await User.findByIdAndUpdate(sub.player, { $inc: { losses: 1 } });
        }
      }
    }
    await room.save();

    const commentary = await generateCommentary(req.user.username, accuracy, room.title);

    // Real-time broadcast
    const io = req.app.get('io');
    if (io) {
      io.to(room.roomCode).emit('submission-received', {
        player: req.user.username,
        accuracy,
        feedback,
        commentary,
      });
      if (room.status === 'completed') {
        const populated = await Room.findById(room._id)
          .populate('winner', 'username')
          .populate('submissions.player', 'username');
        io.to(room.roomCode).emit('match-completed', populated);
      }
    }

    return res.json({ accuracy, feedback, commentary, status: room.status });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc   Delete room (admin only)
// @route  DELETE /api/rooms/:code
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ roomCode: req.params.code });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    return res.json({ message: 'Room deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Expose pure helpers for tests
exports._generateRoomCode = generateRoomCode;
exports._decideWinner = decideWinner;
