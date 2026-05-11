const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for auth endpoints — prevents credential stuffing / brute force.
 * 10 requests per minute per IP.
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts. Please wait a minute.' },
});

/**
 * Limiter for code submissions — each OpenAI call costs money and a malicious
 * player could otherwise hammer the AI judge. 5 submissions per minute per IP.
 */
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Submission rate limit reached. Slow down.' },
});

/**
 * General API limiter — applied at the app level. 100 requests per minute per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, submitLimiter, apiLimiter };
