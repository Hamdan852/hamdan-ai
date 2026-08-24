const MAX = 12000;
const clean = v => typeof v === 'string' ? v.trim().slice(0, MAX) : '';
const words = s => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const brief = clean(req.body?.brief);
  if (!brief) return res.status(400).json({ error: 'Project brief is required.' });

  const w = new Set(words(brief));
  const has = (...xs) => xs.some(x => w.has(x));
  const services = [];
  if (has('website','web','landing','frontend')) services.push('AI Website Development');
  if (has('chatbot','chat','support','assistant')) services.push('AI Chatbot / Support Agent');
  if (has('whatsapp')) services.push('WhatsApp Automation');
  if (has('voice','phone','call')) services.push('Voice AI Agent');
  if (has('video','avatar')) services.push('AI Video Production');
  if (has('automation','workflow','crm','zapier')) services.push('Business Automation');
  if (has('api','integration','saas','software','app')) services.push('AI Software / API Integration');
  if (!services.length) services.push('Custom AI Solution');

  const execution = services.length <= 2 ? 'Hamdan AI' : 'Hybrid';
  return res.status(200).json({
    ok: true,
    stage: 'Plan',
    project: {
      title: clean(req.body?.title) || 'AI Service Project',
      brief,
      recommendedServices: services,
      recommendedExecution: execution,
      next: ['Scope', 'Proposal', 'Approval', 'Development', 'Test', 'Delivery', 'Support']
    },
    note: 'This is an intake recommendation, not a binding quote, contract, or guarantee of delivery time.'
  });
}
