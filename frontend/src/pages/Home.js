import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
      <h1 style={{ fontSize: 48, marginBottom: 20 }}>⚔️ Coding Clash Arena</h1>
      <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 30 }}>
        Compete in head-to-head coding battles judged by AI avatars in real-time
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        {user ? (
          <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
        ) : (
          <>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-secondary">Login</Link>
          </>
        )}
      </div>

      <div className="grid-2" style={{ marginTop: 60, textAlign: 'left' }}>
        <div className="card">
          <h3>🎮 For Players</h3>
          <p style={{ color: '#cbd5e1', marginTop: 10 }}>
            Join coding rooms, solve challenges, and compete head-to-head against another developer.
          </p>
        </div>
        <div className="card">
          <h3>👀 For Spectators</h3>
          <p style={{ color: '#cbd5e1', marginTop: 10 }}>
            Watch live coding battles with AI avatar commentary and real-time score updates.
          </p>
        </div>
        <div className="card">
          <h3>🤖 AI-Judged</h3>
          <p style={{ color: '#cbd5e1', marginTop: 10 }}>
            Submissions are scored by AI for correctness, edge cases, and code quality.
          </p>
        </div>
        <div className="card">
          <h3>🏆 Leaderboards</h3>
          <p style={{ color: '#cbd5e1', marginTop: 10 }}>
            Track wins and losses, climb the ranks, and prove you're the best.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
