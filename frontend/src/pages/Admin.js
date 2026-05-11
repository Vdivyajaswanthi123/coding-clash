import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const Admin = () => {
  const [form, setForm] = useState({
    title: '',
    problemStatement: '',
    difficulty: 'medium',
    timeLimit: 30,
  });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (err) {
      toast.error('Failed to load rooms');
    }
  };

  useEffect(() => { loadRooms(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/rooms', form);
      toast.success(`Room created! Code: ${data.roomCode}`);
      setForm({ title: '', problemStatement: '', difficulty: 'medium', timeLimit: 30 });
      loadRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
    setLoading(false);
  };

  const handleDelete = async (code) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await api.delete(`/rooms/${code}`);
      toast.success('Room deleted');
      loadRooms();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="container" style={{ paddingTop: 30 }}>
      <h1 style={{ marginBottom: 20 }}>👑 Admin Panel</h1>

      <div className="card">
        <h3 style={{ marginBottom: 15 }}>Create New Room</h3>
        <form onSubmit={handleSubmit}>
          <label>Room Title</label>
          <input required value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Two Sum Challenge" />

          <label>Problem Statement</label>
          <textarea required rows={6} value={form.problemStatement}
            onChange={(e) => setForm({ ...form, problemStatement: e.target.value })}
            placeholder="Describe the problem, input, output, constraints..."
            style={{ resize: 'vertical' }} />

          <div className="grid-2">
            <div>
              <label>Difficulty</label>
              <select value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label>Time Limit (minutes)</label>
              <input type="number" min={5} max={180} value={form.timeLimit}
                onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })} />
            </div>
          </div>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      </div>

      <h3 style={{ margin: '30px 0 15px' }}>📋 All Rooms</h3>
      {rooms.map((room) => (
        <div className="card" key={room._id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h4>{room.title} <span className={`badge badge-${room.status === 'in-progress' ? 'progress' : room.status}`}>{room.status}</span></h4>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Code: {room.roomCode}</p>
            </div>
            <button className="btn btn-danger" onClick={() => handleDelete(room.roomCode)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Admin;
