function clean(value, max = 1200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

const INDUSTRIES = new Set(['general', 'real-estate', 'healthcare']);

function buildSystemPrompt(config) {
  const industry = INDUSTRIES.has(config.industry) ? config.industry : 'general';
  const language = clean(config.language, 80) || 'the customer\'s language';
  const base = `You are Hamdan AI, a professional customer-support assistant. Reply in ${language} whenever possible. Be concise, helpful, and transparent. Never invent business policies, prices, appointments, property availability, medical diagnoses, or legal conclusions.`;
  if (industry === 'real-estate') return `${base} You assist a US real-estate business. Help visitors understand buying, selling, renting, financing questions at a general informational level, qualify their goals, and offer a human-agent handoff. Do not claim to be a licensed agent or make discriminatory housing recommendations.`;
  if (industry === 'healthcare') return `${base} You assist a healthcare business with general administrative information. Help collect appointment/contact requests with consent. Do not diagnose, prescribe, or replace a clinician. Encourage urgent professional/emergency care when appropriate.`;
  return `${base} You assist the business with general customer questions and human handoff.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const message = clean(body.message, 4000);
  if (!message) return res.status(400).json({ error: 'Message is required.' });

  const config = {
    industry: clean(body.industry, 80) || 'general',
    language: clean(body.language, 80) || 'the customer\'s language'
  };
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI service is not configured.' });

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5-mini',
        instructions: buildSystemPrompt(config),
        input: message,
        max_output_tokens: 600
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI assistant error', { status: response.status, code: data?.error?.code || 'unknown' });
      return res.status(502).json({ error: 'AI service could not complete the request.' });
    }
    const text = data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text || '').join(' ').trim();
    if (!text) return res.status(502).json({ error: 'AI service returned an empty response.' });
    return res.status(200).json({ success: true, reply: text });
  } catch (error) {
    console.error('Assistant request failed', error?.message || 'Unknown error');
    return res.status(502).json({ error: 'AI service could not complete the request.' });
  }
}
