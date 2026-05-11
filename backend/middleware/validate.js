const Joi = require('joi');

/**
 * Generic Joi-backed request body validator. Usage:
 *   router.post('/x', validate(schema), handler)
 *
 * Strips unknown fields and returns 400 with the first validation message.
 */
const validate = (schema) => (req, res, next) => {
  const { value, error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details.map((d) => d.message),
    });
  }
  req.body = value;
  return next();
};

// ---------- Schemas ----------

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

const createRoomSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  problemStatement: Joi.string().min(10).max(5000).required(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  timeLimit: Joi.number().integer().min(1).max(180).default(30),
});

const joinRoomSchema = Joi.object({
  mode: Joi.string().valid('player', 'spectator').required(),
});

const submitCodeSchema = Joi.object({
  code: Joi.string().min(1).max(50000).required(),
  language: Joi.string().valid('javascript', 'python', 'java').default('javascript'),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createRoomSchema,
  joinRoomSchema,
  submitCodeSchema,
};
