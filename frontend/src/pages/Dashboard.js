import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (err) {
      toast.error('Failed to load rooms');
    }
    setLoading(false);
  };

  useEffect(() => { loadRooms(); }, []);

  const handleJoin = async (code, mode) => {
    try {
      await api.post(`/rooms/${code}/join`, { mode });
      navigate(`/room/${code}?mode=${mode}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join');
    }
  };

  if (loading) return <div className="container">Loading rooms...</div>;

  return (
    <div className="container" style={{ paddingTop: 30 }}>
      <h1 style={{ marginBottom: 20 }}>🎯 Available Arenas</h1>
      {rooms.length === 0 ? (
        <div className="card"><p>No rooms yet. {user.role === 'admin' && 'Create one from the Admin panel!'}</p></div>
      ) : (
        rooms.map((room) => (
          <div className="card" key={room._id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3>{room.title} <span className={`badge badge-${room.status === 'in-progress' ? 'progress' : room.status}`}>{room.status}</span></h3>
                <p style={{ color: '#94a3b8', margin: '8px 0' }}>
                  Code: <strong style={{ color: '#6366f1' }}>{room.roomCode}</strong> |
                  Difficulty: <strong>{room.difficulty}</strong> |
                  Players: {room.players.length}/{room.maxPlayers}
                </p>
                <p style={{ color: '#cbd5e1', marginTop: 6 }}>{room.problemStatement.substring(0, 140)}...</p>
                {room.winner && <p style={{ color: '#10b981', marginTop: 6 }}>🏆 Winner: {room.winner.username}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {room.status === 'waiting' && user.role === 'player' && (
                  <button className="btn btn-primary" onClick={() => handleJoin(room.roomCode, 'player')}>
                    Join as Player
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => handleJoin(room.roomCode, 'spectator')}>
                  Spectate
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Dashboard;
