const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Evaluates submitted code against a problem statement using OpenAI.
 * Returns accuracy (0-100) and feedback string.
 */
const evaluateCode = async (problemStatement, code, language = 'javascript') => {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      // Fallback for when API key isn't set - basic heuristic
      const accuracy = code && code.length > 50 ? 65 : 30;
      return {
        accuracy,
        feedback: 'AI evaluation unavailable. Set OPENAI_API_KEY in .env to enable.',
      };
    }

    const prompt = `You are an AI judge for a competitive coding clash. Evaluate the following code submission against the problem.

PROBLEM STATEMENT:
${problemStatement}

LANGUAGE: ${language}

SUBMITTED CODE:
\`\`\`${language}
${code}
\`\`\`

Score the code on:
- Correctness (does it solve the problem?)
- Edge case handling
- Code quality and readability
- Efficiency

Respond ONLY in valid JSON format like this:
{
  "accuracy": <number between 0 and 100>,
  "feedback": "<2-3 sentence commentary as if you're an excited AI judge giving live feedback>"
}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an AI judge for competitive coding. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return {
      accuracy: Math.min(100, Math.max(0, Number(result.accuracy) || 0)),
      feedback: result.feedback || 'Code evaluated.',
    };
  } catch (error) {
    console.error('AI evaluation error:', error.message);
    return {
      accuracy: 0,
      feedback: `Evaluation error: ${error.message}`,
    };
  }
};

/**
 * Generate live commentary on code submission for spectators
 */
const generateCommentary = async (playerName, accuracy, problemTitle) => {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return `${playerName} submitted with ${accuracy}% accuracy on "${problemTitle}"!`;
    }

    const prompt = `You are an enthusiastic AI commentator for a coding clash arena.
Player "${playerName}" just submitted code for problem "${problemTitle}" with ${accuracy}% accuracy.
Give a single, exciting, 1-sentence live commentary (max 20 words).`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 60,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    return `${playerName} scored ${accuracy}%!`;
  }
};

module.exports = { evaluateCode, generateCommentary };
