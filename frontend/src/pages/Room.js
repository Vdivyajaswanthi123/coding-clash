import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import AIAvatar from '../components/AIAvatar';

const STARTER_CODE = {
  javascript: '// Write your solution here\nfunction solve(input) {\n  \n}\n',
  python: '# Write your solution here\ndef solve(input):\n    pass\n',
  java: 'public class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n',
};

const Room = () => {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'spectator';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [playerCode, setPlayerCode] = useState(STARTER_CODE.javascript);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [liveCode, setLiveCode] = useState({}); // username -> code (for spectators)
  const [commentaries, setCommentaries] = useState([]);
  const [result, setResult] = useState(null);
  const socketRef = useRef(null);

  const loadRoom = async () => {
    try {
      const { data } = await api.get(`/rooms/${code}`);
      setRoom(data);
      if (data.status === 'completed') {
        setResult(data);
      }
    } catch (err) {
      toast.error('Failed to load room');
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    loadRoom();
    const socket = connectSocket();
    socketRef.current = socket;

    socket.emit('join-room', { roomCode: code, username: user.username, mode });

    socket.on('user-joined', ({ username, mode: m }) => {
      toast.info(`${username} joined as ${m}`);
      loadRoom();
    });

    socket.on('code-update', ({ username, code: c }) => {
      setLiveCode((prev) => ({ ...prev, [username]: c }));
    });

    socket.on('submission-received', (data) => {
      setCommentaries((prev) => [...prev, data]);
      toast.success(`${data.player} submitted! ${data.accuracy}%`);
      loadRoom();
    });

    socket.on('match-completed', (finalRoom) => {
      setResult(finalRoom);
      toast.success(`🏆 Match completed! Winner: ${finalRoom.winner?.username}`);
    });

    return () => {
      socket.emit('leave-room', { roomCode: code, username: user.username });
      disconnectSocket();
    };
    // eslint-disable-next-line
  }, [code]);

  const handleCodeChange = (value) => {
    setPlayerCode(value || '');
    if (socketRef.current && mode === 'player') {
      socketRef.current.emit('code-update', {
        roomCode: code,
        username: user.username,
        code: value,
      });
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setPlayerCode(STARTER_CODE[lang] || '');
  };

  const handleSubmit = async () => {
    if (!playerCode.trim()) {
      toast.error('Code cannot be empty');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/rooms/${code}/submit`, {
        code: playerCode,
        language,
      });
      toast.success(`Submitted! Score: ${data.accuracy}%`);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
    setSubmitting(false);
  };

  if (!room) return <div className="container">Loading room...</div>;

  // ============ RESULT VIEW ============
  if (result && result.status === 'completed') {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h1>🏆 Match Completed!</h1>
          <h2 style={{ color: '#10b981', margin: '20px 0' }}>
            Winner: {result.winner?.username}
          </h2>
          <h3 style={{ marginTop: 30 }}>Final Scores</h3>
          {result.submissions.map((s, i) => (
            <div key={i} className="card" style={{ marginTop: 16 }}>
              <h4>{s.player.username}</h4>
              <p style={{ fontSize: 36, color: s.accuracy >= 70 ? '#10b981' : '#f59e0b', margin: '10px 0' }}>
                {s.accuracy}%
              </p>
              <p style={{ color: '#cbd5e1' }}>{s.feedback}</p>
            </div>
          ))}
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: 20 }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============ PLAYER VIEW ============
  if (mode === 'player') {
    return (
      <div className="container" style={{ paddingTop: 20 }}>
        <div className="card">
          <h2>{room.title} <span className={`badge badge-${room.status}`}>{room.status}</span></h2>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>Room: {room.roomCode} | Players: {room.players.length}/{room.maxPlayers}</p>
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', color: '#6366f1' }}>📋 View Problem Statement</summary>
            <pre style={{ marginTop: 10, whiteSpace: 'pre-wrap', color: '#cbd5e1' }}>{room.problemStatement}</pre>
          </details>
        </div>

        {room.status === 'waiting' && (
          <div className="card">
            <h3>⏳ Waiting for opponent...</h3>
            <p style={{ color: '#94a3b8', marginTop: 8 }}>
              {room.players.length}/{room.maxPlayers} players joined. Match starts when room is full.
            </p>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3>💻 Your Code</h3>
            <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} style={{ width: 200 }}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
          <div className="code-editor-wrapper">
            <Editor
              height="450px"
              language={language}
              theme="vs-dark"
              value={playerCode}
              onChange={handleCodeChange}
              options={{ fontSize: 14, minimap: { enabled: false }, readOnly: submitted }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || submitted || room.status !== 'in-progress'}
            style={{ marginTop: 12 }}
          >
            {submitted ? '✅ Submitted' : submitting ? 'Evaluating...' : '🚀 Submit Code'}
          </button>
        </div>
      </div>
    );
  }

  // ============ SPECTATOR VIEW ============
  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="card">
        <h2>👀 Spectating: {room.title}</h2>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>
          Status: <span className={`badge badge-${room.status}`}>{room.status}</span> |
          Spectators: {room.spectators?.length || 0}
        </p>
      </div>

      <div className="grid-2">
        <AIAvatar
          name="Aera"
          emoji="🤖"
          commentary={commentaries[commentaries.length - 1]?.commentary || 'Waiting for action...'}
        />
        <AIAvatar
          name="Bernice"
          emoji="🎭"
          commentary={commentaries.length > 1 ? commentaries[commentaries.length - 2]?.commentary : 'Excited to see how this unfolds!'}
        />
      </div>

      <h3 style={{ marginTop: 30, marginBottom: 15 }}>⚔️ Live Battle</h3>
      <div className="grid-2">
        {room.players.map((p) => (
          <div key={p._id} className="card">
            <h4>👤 {p.username}</h4>
            <div className="code-editor-wrapper" style={{ marginTop: 10 }}>
              <Editor
                height="350px"
                language="javascript"
                theme="vs-dark"
                value={liveCode[p.username] || '// Player is typing...'}
                options={{ readOnly: true, fontSize: 12, minimap: { enabled: false } }}
              />
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 30 }}>📊 Live Commentary Feed</h3>
      {commentaries.length === 0 ? (
        <div className="card"><p style={{ color: '#94a3b8' }}>Waiting for submissions...</p></div>
      ) : (
        commentaries.map((c, i) => (
          <div key={i} className="card">
            <strong>{c.player}</strong> scored <span style={{ color: '#10b981' }}>{c.accuracy}%</span>
            <div className="commentary-box">💬 {c.commentary}</div>
            <p style={{ color: '#cbd5e1', fontSize: 14 }}>{c.feedback}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default Room;
