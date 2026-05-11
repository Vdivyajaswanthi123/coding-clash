const {
  _generateRoomCode,
  _decideWinner,
} = require('../controllers/roomController');

describe('generateRoomCode', () => {
  test('returns an 8-character uppercase alphanumeric string', () => {
    const code = _generateRoomCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  test('produces distinct codes on successive calls (uuid v4 is random)', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i += 1) codes.add(_generateRoomCode());
    // Collisions across 100 random uuid-derived 8-char codes should be 0 in practice.
    expect(codes.size).toBe(100);
  });
});

describe('decideWinner', () => {
  test('returns null when there are no submissions', () => {
    expect(_decideWinner([])).toBeNull();
    expect(_decideWinner(null)).toBeNull();
  });

  test('picks the highest-accuracy submission', () => {
    const subs = [
      { player: 'A', accuracy: 70, submittedAt: '2025-01-01T10:00:00Z' },
      { player: 'B', accuracy: 92, submittedAt: '2025-01-01T10:01:00Z' },
      { player: 'C', accuracy: 65, submittedAt: '2025-01-01T10:02:00Z' },
    ];
    expect(_decideWinner(subs)).toBe('B');
  });

  test('on a tie, the player who submitted first wins', () => {
    const subs = [
      { player: 'late', accuracy: 80, submittedAt: '2025-01-01T10:05:00Z' },
      { player: 'early', accuracy: 80, submittedAt: '2025-01-01T10:00:00Z' },
    ];
    expect(_decideWinner(subs)).toBe('early');
  });
});
