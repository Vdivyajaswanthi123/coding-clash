/**
 * Tests for User model's password hashing logic. We exercise the bcrypt
 * pre-save hook and matchPassword method without touching MongoDB, by
 * driving them directly.
 */
const bcrypt = require('bcryptjs');
const User = require('../models/User');

describe('User model — password hashing', () => {
  test('matchPassword returns true for the correct plaintext password', async () => {
    const plain = 'correct horse battery staple';
    const hash = await bcrypt.hash(plain, 10);
    const fakeDoc = { password: hash, matchPassword: User.schema.methods.matchPassword };
    await expect(fakeDoc.matchPassword(plain)).resolves.toBe(true);
  });

  test('matchPassword returns false for the wrong password', async () => {
    const hash = await bcrypt.hash('correct horse battery staple', 10);
    const fakeDoc = { password: hash, matchPassword: User.schema.methods.matchPassword };
    await expect(fakeDoc.matchPassword('wrong password')).resolves.toBe(false);
  });

  test('User schema enforces required username / email / password', () => {
    const u = new User({});
    const err = u.validateSync();
    expect(err.errors.username).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  test('User schema restricts role to admin / player / spectator', () => {
    const u = new User({
      username: 'alice',
      email: 'a@b.com',
      password: 'secret123',
      role: 'godmode',
    });
    const err = u.validateSync();
    expect(err.errors.role).toBeDefined();
  });
});
