const REPO = 'Hamdan852/hamdan-ai';
const WORKFLOW = ['Understand','Inspect','Plan','Approve','Change','Test','Deploy','Verify'];
const CAPABILITIES = [
  ['Discovery','Requirements, acceptance criteria, user journeys and project scoping'],
  ['Design','Responsive UI, accessibility, design systems, components, themes and motion'],
  ['Engineering','Frontend, backend, APIs, databases, authentication, integrations and AI features'],
  ['AI','Agents, chat, RAG, structured generation, automation, voice, image, audio and video workflows'],
  ['Quality','Unit/integration checks, build validation, security review, performance and browser verification'],
  ['Delivery','GitHub changes, preview environments, production deployment, domain setup and rollback planning'],
  ['Operations','Logs, health checks, incident diagnosis, regression analysis and maintenance'],
  ['Marketplace','Company intake, service matching, proposals, milestones, approvals, delivery and support']
];

const clean = (value, max = 20000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const json = (res, status, data) => res.status(status).json(data);
const allowed = repository => repository === REPO;
const config = () => ({
  configured: Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_NAME),
  required: ['VERCEL_TOKEN', 'VERCEL_PROJECT_NAME']
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}

function assessment(prompt) {
  const text = clean(prompt).toLowerCase();
  let title = 'Initial engineering assessment';
  let summary = 'Hamdan Developer has classified the request and will follow its controlled engineering workflow.';
  let action = 'Inspect project structure, configuration, relevant files and deployment state.';
  let risk = 'Low — planning only';
  let areas = ['Project context', 'Architecture', 'Verification'];
  let stage = 'Inspect';
  if (text.includes('sign in') || text.includes('login') || text.includes('authentication')) {
    title = 'Authentication investigation';
    summary = 'Determine whether the problem is in the UI, session handling, server authentication or deployment configuration.';
    action = 'Inspect authentication UI, session flow, server endpoints, environment configuration and deployment state before changing the system.';
    risk = 'High — authentication changes require controlled approval';
    areas = ['Auth flow', 'Sessions', 'Security'];
  } else if (text.includes('mobile') || text.includes('responsive')) {
    title = 'Responsive design assessment';
    summary = 'Inspect the existing layout and breakpoints first, then make targeted responsive changes.';
    action = 'Inspect viewport behavior, sidebar/header rules, overflow and touch targets; then test common phone widths.';
    risk = 'Low — UI changes can be tested before release';
    areas = ['Responsive CSS', 'Navigation', 'Accessibility'];
  } else if (text.includes('deploy') || text.includes('vercel') || text.includes('build')) {
    title = 'Deployment investigation';
    summary = 'Diagnose deployment problems from actual build and runtime state rather than guessing from the frontend.';
    action = 'Inspect deployment metadata, build logs, environment variables, routes and runtime errors.';
    risk = 'Medium — deployment changes can affect production';
    areas = ['Build', 'Environment', 'Runtime'];
  } else if (text.includes('gpu') || text.includes('ai infrastructure') || text.includes('video generation')) {
    title = 'AI infrastructure assessment';
    summary = 'Separate the public web application from compute workers so future GPU infrastructure can be added safely.';
    action = 'Define a job queue, worker API, model adapter layer, storage flow and resource monitoring strategy.';
    risk = 'Medium — infrastructure design should precede hardware purchases';
    areas = ['GPU worker', 'Job queue', 'Model adapters'];
    stage = 'Plan';
  } else if (text.includes('security') || text.includes('hack') || text.includes('secure')) {
    title = 'Security assessment';
    summary = 'Security should be treated as an architecture concern, not just a collection of frontend protections.';
    action = 'Inspect authentication, authorization, secrets, API routes, file handling, dependencies, logging and deployment configuration.';
    risk = 'High — security changes need careful verification';
    areas = ['Secrets', 'Authorization', 'Attack surface'];
  }
  return {
    title, summary, action, risk, areas, stage, workflow: WORKFLOW,
    inspection: { endpoint: '/api/project-inspect', repository: REPO, readOnly: true, next: 'Inspect approved repository state before proposing code changes' },
    nextStages: WORKFLOW.slice(WORKFLOW.indexOf(stage) + 1),
    mode: 'deterministic-workflow'
  };
}

function generatedWebsite(project) {
  const title = escapeHtml(project.name);
  const description = escapeHtml(project.brief);
  const type = escapeHtml(project.type || 'Custom');
  return [
    {
      path: 'index.html',
      purpose: 'Website entry page',
      content: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${description}"><title>${title}</title><link rel="stylesheet" href="styles.css"></head><body><header class="site-header"><a href="#" class="brand">${title}</a><nav aria-label="Primary"><a href="#about">About</a><a href="#services">Services</a><a href="#contact">Contact</a></nav></header><main><section class="hero"><p class="eyebrow">${type}</p><h1>${title}</h1><p>${description}</p><a class="button" href="#contact">Get started</a></section><section id="about"><h2>Built with Hamdan Developer</h2><p>A responsive, accessible foundation ready for refinement, testing and deployment.</p></section><section id="services"><h2>Services</h2><div class="grid"><article><h3>Fast</h3><p>Performance-focused foundation.</p></article><article><h3>Responsive</h3><p>Designed for phones, tablets and desktops.</p></article><article><h3>Accessible</h3><p>Semantic structure and usable controls.</p></article></div></section><section id="contact"><h2>Contact</h2><form><label>Name<input required name="name" autocomplete="name"></label><label>Email<input required type="email" name="email" autocomplete="email"></label><button type="submit">Send</button></form></section></main><script src="app.js"></script></body></html>`
    },
    {
      path: 'styles.css',
      purpose: 'Responsive visual system',
      content: `:root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111;background:#fff}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;line-height:1.6}.site-header{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:20px 6%;border-bottom:1px solid #eee;position:sticky;top:0;background:rgba(255,255,255,.96);backdrop-filter:blur(10px);z-index:2}.brand{font-weight:800;text-decoration:none;color:inherit}.site-header nav{display:flex;gap:20px;flex-wrap:wrap}.site-header nav a{color:inherit;text-decoration:none}.hero{min-height:70vh;display:grid;align-content:center;padding:80px 8%;max-width:1100px;margin:auto}.hero h1{font-size:clamp(3rem,8vw,6rem);line-height:1;margin:.2em 0}.eyebrow{font-weight:700;letter-spacing:.12em;text-transform:uppercase}.button,button{display:inline-block;border:0;padding:12px 20px;border-radius:10px;cursor:pointer}.hero .button{background:#111;color:#fff;text-decoration:none;width:max-content}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.grid article{padding:30px;border:1px solid #eee;border-radius:16px}section{padding:70px 8%;max-width:1100px;margin:auto}form{display:grid;gap:16px;max-width:500px}label{display:grid;gap:6px}input{padding:12px;border:1px solid #ccc;border-radius:8px}@media(max-width:700px){.site-header{align-items:flex-start;flex-direction:column}.grid{grid-template-columns:1fr}.hero h1{font-size:clamp(2.5rem,14vw,4rem)}}`
    },
    {
      path: 'app.js',
      purpose: 'Interactive behavior',
      content: `document.addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget;form.innerHTML='<p>Thanks — your request has been received.</p>';});`
    },
    {
      path: 'README.md',
      purpose: 'Project instructions and requirements',
      content: `# ${project.name}\n\nGenerated by Hamdan Developer.\n\nType: ${project.type || 'Custom'}\n\nBrief:\n${project.brief}\n\nNext: test, review, deploy and verify.`
    }
  ];
}

function validateGeneratedFiles(files) {
  const required = ['index.html', 'styles.css', 'app.js', 'README.md'];
  const list = Array.isArray(files) ? files : [];
  const paths = new Set(list.map(file => clean(file?.path, 200)));
  const missing = required.filter(path => !paths.has(path));
  const contentErrors = list.filter(file => !clean(file?.content, 50000)).map(file => clean(file?.path, 200));
  return { missing, contentErrors, passed: missing.length === 0 && contentErrors.length === 0 };
}

export default async function handler(req, res) {
  try {
    if (!['GET', 'POST'].includes(req.method)) return json(res, 405, { error: 'Method not allowed' });
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { return json(res, 400, { error: 'Invalid JSON request body.' }); }
    }
    const query = req.query || {};
    const op = clean(body.op || query.op);
    const repository = clean(body.repository || query.repository);
    if (repository && !allowed(repository)) return json(res, 403, { error: 'Repository is not approved.' });

    if (req.method === 'GET' && op === 'capabilities') {
      return json(res, 200, { ok: true, product: 'Hamdan Developer', version: 'foundation', principles: ['Understand before changing','Small reviewable changes','Approval before material actions','Test before deploy','Verify after deploy','Secrets remain server-side'], capabilities: CAPABILITIES, workflow: [...WORKFLOW, 'Operate'] });
    }

    if (op === 'assessment' || op === 'assess') {
      const prompt = clean(body.prompt);
      if (!prompt) return json(res, 400, { error: 'A developer question is required.' });
      return json(res, 200, assessment(prompt));
    }

    if (op === 'approve') {
      const projectId = clean(body.projectId);
      if (!projectId) return json(res, 400, { error: 'A project ID is required for approval.' });
      return json(res, 200, { ok: true, stage: 'Approve', approved: true, projectId, repository: REPO, approval: { granted: true, scope: 'Generate and test the approved website project', externalWrites: false, deployment: false }, message: 'Plan approved. Code generation and testing are now authorized; deployment remains a separate approval.' });
    }

    if (op === 'website-generate') {
      const project = body.project;
      if (!allowed(repository)) return json(res, 403, { error: 'Repository is not approved.' });
      if (body.approved !== true) return json(res, 403, { error: 'Explicit approval is required before generating files.' });
      if (!project?.id || !project?.name || !project?.brief) return json(res, 400, { error: 'A valid approved website project is required.' });
      const files = generatedWebsite(project);
      return json(res, 200, { ok: true, stage: 'Change', repository: REPO, project: { ...project, status: 'Generated', generatedAt: new Date().toISOString() }, files, writesPerformed: false, deploymentPerformed: false, next: ['Test', 'Deploy', 'Verify'], message: 'Website files generated successfully. No repository write or deployment was performed.' });
    }

    if (op === 'website-test') {
      const files = Array.isArray(body.files) ? body.files : [];
      if (!allowed(repository)) return json(res, 403, { error: 'Repository is not approved.' });
      if (body.approved !== true) return json(res, 403, { error: 'Explicit approval is required before testing.' });
      if (!files.length) return json(res, 400, { error: 'Generated website files are required before testing.' });
      const result = validateGeneratedFiles(files);
      return json(res, 200, { ok: result.passed, stage: 'Test', repository: REPO, tests: { requiredFiles: result.missing.length === 0, nonEmptyFiles: result.contentErrors.length === 0 }, missing: result.missing, contentErrors: result.contentErrors, checks: [{ name: 'Required project files', passed: result.missing.length === 0 }, { name: 'Non-empty generated files', passed: result.contentErrors.length === 0 }, { name: 'Repository target approved', passed: true }], next: result.passed ? ['Deploy', 'Verify'] : ['Change', 'Test'], deploymentPerformed: false, message: result.passed ? 'Pre-deployment validation passed.' : 'Pre-deployment validation found issues; no deployment was attempted.' });
    }

    if (op === 'run' || op === 'execute') {
      const action = clean(body.action);
      const approved = body.approved === true;
      if (!['plan','generate','build','test','deploy-prepare','deploy','verify'].includes(action)) return json(res, 400, { error: 'Unsupported workflow action.' });
      if (['generate','build','deploy-prepare','deploy'].includes(action) && !approved) return json(res, 403, { error: 'Explicit approval is required for this action.' });
      const stage = { plan: 'Plan', generate: 'Change', build: 'Change', test: 'Test', 'deploy-prepare': 'Deploy', deploy: 'Deploy', verify: 'Verify' }[action];
      return json(res, 200, { ok: true, stage, repository: REPO, action, workflow: WORKFLOW, requestId: clean(body.requestId) || `req_${Date.now().toString(36)}`, execution: { started: true, externalWrites: false, deploymentStarted: false, verificationRequired: stage === 'Deploy' }, message: action === 'verify' ? 'Verification stage prepared.' : 'Workflow stage prepared. Connect an authorized worker to perform external code, test, or deployment operations.' });
    }

    if (op === 'deployment-config' || op === 'vercel-readiness') return json(res, 200, { ok: true, ...config(), provider: 'vercel' });

    if (op === 'artifact') {
      if (body.approved !== true) return json(res, 403, { error: 'Explicit approval is required.' });
      const project = body.project;
      const files = Array.isArray(body.files) ? body.files : [];
      if (!project?.id || !project?.name || !files.length) return json(res, 400, { error: 'Project and generated files are required.' });
      return json(res, 200, { ok: true, stage: 'Change', artifact: { id: `artifact_${project.id}_${Date.now().toString(36)}`, projectId: project.id, projectName: project.name, repository: REPO, files: files.map(f => ({ path: clean(f.path), purpose: clean(f.purpose), content: clean(f.content) })).filter(f => f.path && f.content), environment: 'preview', ready: true, verificationRequired: true } });
    }

    if (op === 'deployment-request') {
      const artifact = body.artifact;
      const target = clean(body.target) || 'preview';
      if (!artifact?.id || !artifact.files?.length) return json(res, 400, { error: 'A populated deployment artifact is required.' });
      if (!['preview', 'production'].includes(target)) return json(res, 400, { error: 'Invalid deployment target.' });
      if (target === 'production' && body.approved !== true) return json(res, 403, { error: 'Explicit production approval is required.' });
      if (!config().configured) return json(res, 503, { error: 'Vercel deployment is not configured.', required: config().required });
      const upstream = await fetch('https://api.vercel.com/v13/deployments', { method: 'POST', headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: clean(body.project) || artifact.projectName || 'hamdan-project', target, files: artifact.files.map(f => ({ file: clean(f.path), data: clean(f.content) })) }) });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return json(res, upstream.status, { ok: false, error: data?.error?.message || 'Vercel deployment request failed.', provider: 'vercel' });
      return json(res, 200, { ok: true, provider: 'vercel', deploymentId: data.id || null, url: data.url ? `https://${data.url}` : null, state: data.readyState || 'QUEUED', verificationRequired: true });
    }

    return json(res, 400, { error: 'Unknown Hamdan API operation.' });
  } catch (error) {
    console.error('Hamdan API error', error);
    return json(res, 500, { ok: false, error: error?.message || 'Hamdan Developer server error.', operation: clean(req.body?.op || req.query?.op) || 'unknown' });
  }
}
