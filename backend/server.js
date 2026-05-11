require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimit');

// --- Required-env check (fail fast) ----------------------------------------
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `[fatal] Missing required env vars: ${missing.join(', ')}. ` +
      `Copy backend/.env.example to backend/.env and fill it in.`
  );
  process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
  console.warn(
    '[warn] OPENAI_API_KEY not set. AI judge will return a heuristic fallback ' +
      'score; live evaluation will not work until you set this.'
  );
}

connectDB();

const app = express();
const server = http.createServer(app);

// CORS — strictly the configured client origin
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use('/api/', apiLimiter);

// --- Socket.io --------------------------------------------------------------
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`socket connected: ${socket.id}`);

  socket.on('join-room', ({ roomCode, username, mode }) => {
    if (!roomCode || !username) return;
    socket.join(roomCode);
    io.to(roomCode).emit('user-joined', { username, mode, socketId: socket.id });
  });

  socket.on('code-update', ({ roomCode, username, code }) => {
    if (!roomCode || !username) return;
    // Broadcast typing to other clients in the same room (spectators + opponent)
    socket.to(roomCode).emit('code-update', { username, code });
  });

  socket.on('leave-room', ({ roomCode, username }) => {
    if (!roomCode) return;
    socket.leave(roomCode);
    io.to(roomCode).emit('user-left', { username });
  });

  socket.on('disconnect', () => {
    console.log(`socket disconnected: ${socket.id}`);
  });
});

// --- Routes -----------------------------------------------------------------
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'coding-clash-arena' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Coding Clash Arena API' });
});

// --- Centralised error handler ---------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Coding Clash Arena server listening on :${PORT}`);
  });
}

module.exports = { app, server, io };
