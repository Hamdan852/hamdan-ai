(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  $$(".nav").forEach(button => button.addEventListener("click", () => {
    const view = button.dataset.view;
    $$(".nav").forEach(b => b.classList.toggle("active", b === button));
    $$(".view").forEach(v => v.classList.toggle("active", v.id === view));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));

  $$(".quick-prompts button").forEach(button => button.addEventListener("click", () => {
    $("#developerPrompt").value = button.dataset.prompt;
    $("#developerPrompt").focus();
  }));

  function analyze(prompt) {
    const text = prompt.toLowerCase();
    let title = "Initial engineering assessment";
    let summary = "I understand the goal. The next step is to inspect the actual project before making consequential changes.";
    let action = "Inspect project structure, configuration, relevant files and deployment state.";
    let risk = "Low — planning only";
    let areas = ["Project context", "Architecture", "Verification"];
    if (text.includes("sign in") || text.includes("login") || text.includes("authentication")) { title="Authentication investigation"; summary="Determine whether the problem is in the UI, session handling, server authentication, or deployment configuration."; action="Inspect authentication UI, session flow, server endpoints, environment configuration and deployment logs."; risk="High — authentication changes require controlled approval"; areas=["Auth flow","Sessions","Security"]; }
    else if (text.includes("mobile") || text.includes("responsive")) { title="Responsive design assessment"; summary="Inspect the existing layout and breakpoints first, then make targeted responsive changes."; action="Inspect viewport behavior, sidebar/header rules, overflow and touch targets; then test common phone widths."; risk="Low — UI changes can be tested before release"; areas=["Responsive CSS","Navigation","Accessibility"]; }
    else if (text.includes("deploy") || text.includes("vercel") || text.includes("build")) { title="Deployment investigation"; summary="Diagnose deployment problems from actual build and runtime state."; action="Inspect deployment metadata, build logs, environment variables, routes and runtime errors."; risk="Medium — deployment changes can affect production"; areas=["Build","Environment","Runtime"]; }
    else if (text.includes("gpu") || text.includes("ai infrastructure") || text.includes("video generation")) { title="AI infrastructure assessment"; summary="Separate the public web application from compute workers so future GPU infrastructure can be added safely."; action="Define a job queue, worker API, model adapter layer, storage flow and resource monitoring strategy."; risk="Medium — infrastructure design should precede hardware purchases"; areas=["GPU worker","Job queue","Model adapters"]; }
    else if (text.includes("security") || text.includes("hack") || text.includes("secure")) { title="Security assessment"; summary="Security should be treated as an architecture concern, not just frontend protections."; action="Inspect authentication, authorization, secrets, API routes, file handling, dependencies, logging and deployment configuration."; risk="High — security changes need careful verification"; areas=["Secrets","Authorization","Attack surface"]; }
    return { title, summary, action, risk, areas, stage:"Inspect", workflow:["Understand","Inspect","Plan","Approve","Change","Test","Deploy","Verify"], inspection:{endpoint:"/api/project-inspect",repository:"Hamdan852/hamdan-ai",readOnly:true,next:"Inspect approved repository state before proposing code changes"} };
  }

  $("#askDeveloper").addEventListener("click", async () => {
    const prompt = $("#developerPrompt").value.trim();
    if (!prompt) { $("#developerPrompt").focus(); return; }
    const result = $("#developerResult");
    result.hidden = false;
    result.innerHTML = '<h3>Thinking through the problem…</h3><p>Hamdan Developer is following its controlled engineering workflow.</p>';
    try {
      const response = await fetch("/api/developer", { method:"POST", headers:{"Content-Type":"application/json",accept:"application/json"}, body:JSON.stringify({prompt}) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Developer service unavailable");
      renderResult(data);
    } catch (error) { renderResult(analyze(prompt)); }
  });

  function renderResult(data) {
    const result = $("#developerResult");
    const workflow = (data.workflow || []).map((item, index) => `<span class="workflow-step ${item === data.stage ? "current" : index < (data.workflow || []).indexOf(data.stage) ? "done" : ""}">${index + 1}. ${escapeHtml(item)}</span>`).join("");
    result.innerHTML = `<h3>${escapeHtml(data.title)}</h3><p>${escapeHtml(data.summary)}</p><div class="workflow-track">${workflow}</div><div class="result-grid"><div><b>Recommended next action</b><span>${escapeHtml(data.action)}</span></div><div><b>Risk level</b><span>${escapeHtml(data.risk)}</span></div><div><b>Focus areas</b><span>${(data.areas || []).map(escapeHtml).join(" · ")}</span></div><div><b>Inspection</b><span>Read-only · ${escapeHtml(data.inspection?.repository || "approved repository")}</span></div></div>`;
  }

  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
})();
