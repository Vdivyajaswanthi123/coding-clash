import React from 'react';

const AIAvatar = ({ name, emoji, commentary }) => (
  <div className="card" style={{ textAlign: 'center' }}>
    <div className="avatar" style={{ margin: '0 auto 10px' }}>{emoji}</div>
    <h3>{name}</h3>
    <p style={{ color: '#94a3b8', fontSize: '13px' }}>AI Judge</p>
    {commentary && (
      <div className="commentary-box">
        💬 {commentary}
      </div>
    )}
  </div>
);

export default AIAvatar;
