const { requireRole } = require('../middleware/auth');

/**
 * Pure-logic tests for the role-guard middleware. No DB, no network.
 */

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('requireRole middleware', () => {
  test('lets a user with an allowed role through', () => {
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    requireRole('admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('lets a user through when role matches any of several allowed roles', () => {
    const req = { user: { role: 'player' } };
    const res = mockRes();
    const next = jest.fn();

    requireRole('admin', 'player', 'spectator')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('rejects with 403 when role is not allowed', () => {
    const req = { user: { role: 'spectator' } };
    const res = mockRes();
    const next = jest.fn();

    requireRole('admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Forbidden') })
    );
  });

  test('rejects with 401 when no user is attached', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    requireRole('admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
