const {
  validate,
  registerSchema,
  createRoomSchema,
  submitCodeSchema,
} = require('../middleware/validate');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('validate middleware', () => {
  describe('registerSchema', () => {
    test('accepts a valid registration payload', () => {
      const req = {
        body: { username: 'alice', email: 'a@b.com', password: 'secret123' },
      };
      const res = mockRes();
      const next = jest.fn();

      validate(registerSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('rejects an invalid email', () => {
      const req = {
        body: { username: 'alice', email: 'not-an-email', password: 'secret123' },
      };
      const res = mockRes();
      const next = jest.fn();

      validate(registerSchema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('rejects a too-short password', () => {
      const req = { body: { username: 'alice', email: 'a@b.com', password: '12' } };
      const res = mockRes();
      const next = jest.fn();

      validate(registerSchema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('strips unknown fields (e.g. attempts to set role=admin)', () => {
      const req = {
        body: {
          username: 'alice',
          email: 'a@b.com',
          password: 'secret123',
          role: 'admin', // not in schema
        },
      };
      const res = mockRes();
      const next = jest.fn();

      validate(registerSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).not.toHaveProperty('role');
    });
  });

  describe('createRoomSchema', () => {
    test('applies default difficulty and timeLimit', () => {
      const req = {
        body: { title: 'Two Sum', problemStatement: 'Add two numbers from the array' },
      };
      const res = mockRes();
      const next = jest.fn();

      validate(createRoomSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.difficulty).toBe('medium');
      expect(req.body.timeLimit).toBe(30);
    });

    test('rejects invalid difficulty', () => {
      const req = {
        body: {
          title: 'Two Sum',
          problemStatement: 'Add two numbers',
          difficulty: 'impossible',
        },
      };
      const res = mockRes();
      const next = jest.fn();

      validate(createRoomSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('submitCodeSchema', () => {
    test('rejects empty code', () => {
      const req = { body: { code: '', language: 'javascript' } };
      const res = mockRes();
      const next = jest.fn();

      validate(submitCodeSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('rejects an unsupported language', () => {
      const req = { body: { code: 'print("hi")', language: 'ruby' } };
      const res = mockRes();
      const next = jest.fn();

      validate(submitCodeSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
