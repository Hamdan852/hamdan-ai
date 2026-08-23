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

    if (text.includes("sign in") || text.includes("login") || text.includes("authentication")) {
      title = "Authentication investigation";
      summary = "The first priority is to determine whether the problem is in the UI, session handling, server authentication, or deployment configuration. A production login should not rely on browser-only credentials.";
      action = "Inspect the authentication UI, session flow, server endpoints, environment configuration and deployment logs before changing the system.";
      risk = "High — authentication changes require controlled approval";
      areas = ["Auth flow", "Sessions", "Security"];
    } else if (text.includes("mobile") || text.includes("responsive")) {
      title = "Responsive design assessment";
      summary = "The safest approach is to inspect the existing layout and breakpoints first, then make targeted responsive changes instead of redesigning the whole interface.";
      action = "Inspect viewport behavior, sidebar/header rules, overflow and touch targets; then test common phone widths.";
      risk = "Low — UI changes can be tested before release";
      areas = ["Responsive CSS", "Navigation", "Accessibility"];
    } else if (text.includes("deploy") || text.includes("vercel") || text.includes("build")) {
      title = "Deployment investigation";
      summary = "Deployment problems should be diagnosed from the actual build and runtime state rather than guessed from the frontend.";
      action = "Inspect deployment metadata, build logs, environment variables, routes and runtime errors; identify the first actionable failure.";
      risk = "Medium — deployment changes can affect production";
      areas = ["Build", "Environment", "Runtime"];
    } else if (text.includes("gpu") || text.includes("ai infrastructure") || text.includes("video generation")) {
      title = "AI infrastructure assessment";
      summary = "A sustainable Hamdan architecture should separate the public web application from compute workers. That lets your future GPU machine become a worker without redesigning the website.";
      action = "Define a job queue, worker API, model adapter layer, storage flow, resource monitoring and fallback strategy.";
      risk = "Medium — infrastructure design should precede hardware purchases";
      areas = ["GPU worker", "Job queue", "Model adapters"];
    } else if (text.includes("security") || text.includes("hack") || text.includes("secure")) {
      title = "Security assessment";
      summary = "Security should be treated as an architecture concern, not just a collection of frontend protections.";
      action = "Inspect authentication, authorization, secrets, API routes, file handling, dependencies, logging and deployment configuration.";
      risk = "High — security changes need careful verification";
      areas = ["Secrets", "Authorization", "Attack surface"];
    }

    return { title, summary, action, risk, areas };
  }

  $("#askDeveloper").addEventListener("click", async () => {
    const prompt = $("#developerPrompt").value.trim();
    if (!prompt) {
      $("#developerPrompt").focus();
      return;
    }

    const result = $("#developerResult");
    result.hidden = false;
    result.innerHTML = '<h3>Thinking through the problem…</h3><p>Hamdan Developer is separating the goal, risks and next engineering action.</p>';

    try {
      const response = await fetch("/api/developer", {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Developer service unavailable");
      renderResult(data);
    } catch (error) {
      renderResult(analyze(prompt));
    }
  });

  function renderResult(data) {
    const result = $("#developerResult");
    result.innerHTML = `
      <h3>${escapeHtml(data.title)}</h3>
      <p>${escapeHtml(data.summary)}</p>
      <div class="result-grid">
        <div><b>Recommended next action</b><span>${escapeHtml(data.action)}</span></div>
        <div><b>Risk level</b><span>${escapeHtml(data.risk)}</span></div>
        <div><b>Focus areas</b><span>${(data.areas || []).map(escapeHtml).join(" · ")}</span></div>
      </div>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
  }
})();
