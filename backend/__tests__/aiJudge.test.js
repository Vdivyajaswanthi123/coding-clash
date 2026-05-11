/**
 * AI judge tests. We exercise the fallback path (no OPENAI_API_KEY) so the test
 * suite is hermetic — it never hits the network.
 */

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.OPENAI_API_KEY;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('aiJudge.evaluateCode (fallback)', () => {
  test('returns a heuristic score when no API key is configured', async () => {
    const { evaluateCode } = require('../services/aiJudge');
    const longCode = 'function solve(x){ return x * 2; }'.repeat(5);
    const result = await evaluateCode('Multiply input by 2', longCode, 'javascript');
    expect(typeof result.accuracy).toBe('number');
    expect(result.accuracy).toBeGreaterThanOrEqual(0);
    expect(result.accuracy).toBeLessThanOrEqual(100);
    expect(typeof result.feedback).toBe('string');
    expect(result.feedback.toLowerCase()).toContain('openai_api_key');
  });

  test('returns a lower fallback score for trivially short code', async () => {
    const { evaluateCode } = require('../services/aiJudge');
    const shortResult = await evaluateCode('x', 'a', 'javascript');
    const longResult = await evaluateCode(
      'x',
      'function solve(){ return 42; }'.repeat(5),
      'javascript'
    );
    expect(longResult.accuracy).toBeGreaterThan(shortResult.accuracy);
  });
});

describe('aiJudge.generateCommentary (fallback)', () => {
  test('returns a non-empty string mentioning the player and score', async () => {
    const { generateCommentary } = require('../services/aiJudge');
    const line = await generateCommentary('Alice', 87, 'Two Sum');
    expect(typeof line).toBe('string');
    expect(line).toContain('Alice');
    expect(line).toContain('87');
  });
});
