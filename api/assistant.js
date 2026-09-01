function clean(value, max = 1200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

const INDUSTRIES = new Set(['general', 'real-estate', 'healthcare']);

function buildSystemPrompt(config) {
  const industry = INDUSTRIES.has(config.industry) ? config.industry : 'general';
  const language = clean(config.language, 80) || "the customer's language";
  const base = `You are Hamdan AI, a professional multilingual business assistant. Reply in ${language} whenever possible. Be concise, useful, warm, and transparent. Answer questions directly when you have enough information. Never invent business policies, prices, appointments, property availability, medical diagnoses, or legal conclusions. If business-specific information is unavailable, say so and offer a human handoff.`;
  if (industry === 'real-estate') return `${base} You assist a real-estate business. Help visitors with general buying, selling, renting, financing and property questions, qualify their goals, and offer a human-agent handoff. Ask for budget, location and timing only when useful. Do not claim to be a licensed agent or make discriminatory housing recommendations.`;
  if (industry === 'healthcare') return `${base} You assist a healthcare business with general administrative information. Help with services, hours, locations and appointment/contact requests with consent. Do not diagnose, prescribe, or replace a clinician. For emergencies, tell the user to contact local emergency services or an appropriate urgent-care professional.`;
  return `${base} You assist the business with general customer questions, useful information and human handoff.`;
}

function buildInput(message, history) {
  const items = Array.isArray(history) ? history.slice(-8) : [];
  const transcript = items
    .map(item => {
      const role = item?.role === 'assistant' ? 'Assistant' : 'Customer';
      return `${role}: ${clean(item?.content, 1500)}`;
    })
    .filter(line => line.endsWith(': ') === false)
    .join('\n');
  return transcript ? `Recent conversation:\n${transcript}\n\nCustomer's latest message:\n${message}` : message;
}

function fallbackReply(message, language) {
  const text = message.toLowerCase();
  const romanUrdu = /\b(aap|ap|kaise|kese|kya|hain|hai|mujhe|meri|madad|kar|sakte|sakty|chahiye|bataye|batao|kahan|kab|kitna|kyun|kon|kaun|acha|theek|assalam|salam)\b/i.test(message);
  const wantsIdentity = /\b(who are you|what are you|your name|aap kon|aap kaun|tum kon|tum kaun|kaun ho)\b/i.test(message);
  const wantsServices = /(service|services|what do you|what can you|capabilit|provide|offer|features|kya.*(service|provide)|kya.*kar)/i.test(message);
  const wantsHelp = /(help|madad|support|problem|issue|masla|how can)/i.test(message);
  const wantsContact = /(contact|human|agent|team|phone|email|insaan|person|representative)/i.test(message);
  const wantsVideo = /(video|generate|create|make|ban|video)/i.test(message);
  const wantsPricing = /(price|pricing|cost|costs|plan|plans|credit|credits|kitna|qeemat|rate)/i.test(message);
  const wantsHours = /(hours|open|closed|timing|time|kab.*open|kab.*band)/i.test(message);

  if (romanUrdu || /^ur/i.test(language)) {
    if (wantsIdentity) return "Main Hamdan AI Assistant hoon. Main video creation guidance, business support aur zaroorat par human team tak handoff mein madad karta hoon.";
    if (wantsServices) return "Hamdan AI mein text-to-video workflows, templates, multilingual assistance aur business support shamil hain. Aap apni zaroorat ya video idea bata dein.";
    if (wantsContact) return "Bilkul. Human team se baat karne ke liye ‘Talk to a human / Send my details’ button use karein.";
    if (wantsPricing) return "Pricing aur credits ki exact information is assistant mein configured nahi hai. Main aap ko human team tak connect kar sakta hoon.";
    if (wantsHours) return "Business ke exact hours abhi assistant mein configured nahi hain. Neeche human handoff option se team se confirm kar sakte hain.";
    if (wantsVideo) return "Bilkul. Apni video ka idea, duration, language, format aur style batayein. Main aap ko Hamdan AI ke available creation workflow ke mutabiq guide karunga.";
    if (wantsHelp) return "Bilkul, main Hamdan AI Assistant hoon. Aap apna sawal ya problem Roman Urdu ya English mein likh sakte hain.";
    return "Assalam-o-alaikum! Main Hamdan AI Assistant hoon. Aap mujhe apna sawal, business support request, ya video idea bata sakte hain.";
  }

  if (wantsIdentity) return "I’m Hamdan AI Assistant. I help visitors with video-creation guidance, business questions, support, and human handoff when needed.";
  if (wantsServices) return "Hamdan AI currently provides text-to-video workflows, templates, multilingual assistance, business support, and human handoff. Tell me what you need and I’ll guide you.";
  if (wantsContact) return "Absolutely. Use the “Talk to a human / Send my details” option in the assistant panel and the business can receive your contact request.";
  if (wantsPricing) return "Exact pricing and credit plans are not configured in the assistant right now, so I won’t guess. I can help you contact the business for current pricing.";
  if (wantsHours) return "The business’s exact opening hours are not configured in the assistant right now. Please use the human handoff option to confirm them.";
  if (wantsVideo) return "Absolutely. Tell me your video idea, preferred duration, language, format, and style. I’ll guide you through the available Hamdan AI creation workflow.";
  if (wantsHelp) return "I’m Hamdan AI Assistant. I can help with video creation, business questions, services, support, and connecting you with a human team member.";
  return "Hello! I’m Hamdan AI Assistant. Ask me about video creation, services, business support, or how to contact the team.";
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const message = clean(body.message, 4000);
  if (!message) return res.status(400).json({ error: 'message_required' });

  const config = {
    industry: clean(body.industry, 80) || 'general',
    language: clean(body.language, 80) || "the customer's language"
  };
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(200).json({
      success: true,
      fallback: true,
      reply: fallbackReply(message, config.language)
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5-mini',
        instructions: buildSystemPrompt(config),
        input: buildInput(message, body.history),
        max_output_tokens: 700
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI assistant error', { status: response.status, code: data?.error?.code || 'unknown' });
      return res.status(502).json({ error: 'ai_request_failed', message: 'AI service could not complete the request.' });
    }
    const text = data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text || '').join(' ').trim();
    if (!text) return res.status(502).json({ error: 'empty_ai_response', message: 'AI service returned an empty response.' });
    return res.status(200).json({ success: true, reply: text });
  } catch (error) {
    console.error('Assistant request failed', error?.message || 'Unknown error');
    return res.status(502).json({ error: 'ai_request_failed', message: 'AI service could not complete the request.' });
  }
}
