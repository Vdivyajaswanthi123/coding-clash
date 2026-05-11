const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    accuracy: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    problemStatement: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    spectators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxPlayers: {
      type: Number,
      default: 2,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'completed'],
      default: 'waiting',
    },
    submissions: [submissionSchema],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    timeLimit: { type: Number, default: 30 }, // minutes
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
