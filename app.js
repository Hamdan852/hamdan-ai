/* Hamdan AI — frontend application logic
 * GitHub Pages safe: no API keys or payment secrets are stored here.
 */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const state = {
    mode: "text-to-video",
    language: localStorage.getItem("hamdan.language") || "English",
    credits: Number(localStorage.getItem("hamdan.credits") || 120),
    projects: JSON.parse(localStorage.getItem("hamdan.projects") || "[]"),
    files: []
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function notify(message, type = "info") {
    let box = $("#hamdan-toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "hamdan-toast";
      box.setAttribute("role", "status");
      Object.assign(box.style, {
        position:"fixed", right:"20px", bottom:"20px", zIndex:"9999",
        maxWidth:"360px", padding:"14px 18px", borderRadius:"12px",
        background:type === "error" ? "#b42318" : "#111827",
        color:"#fff", boxShadow:"0 10px 30px rgba(0,0,0,.2)"
      });
      document.body.appendChild(box);
    }
    box.textContent = message;
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.remove(), 3500);
  }

  function save() {
    localStorage.setItem("hamdan.language", state.language);
    localStorage.setItem("hamdan.credits", String(state.credits));
    localStorage.setItem("hamdan.projects", JSON.stringify(state.projects));
  }

  function updateCredits() {
    $$("[data-credits], #credits").forEach(el => el.textContent = state.credits);
  }

  function setMode(mode) {
    state.mode = mode;
    $$("[data-mode]").forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    const name = mode.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    $$("[data-current-mode]").forEach(el => el.textContent = name);
  }

  function renderProjects() {
    $$("[data-projects]").forEach(container => {
      if (!state.projects.length) {
        container.innerHTML = "<p>No projects yet. Create your first video above.</p>";
        return;
      }
      container.innerHTML = state.projects.map(p => `
        <article class="hamdan-project" data-project-id="${escapeHtml(p.id)}">
          <div><strong>${escapeHtml(p.title)}</strong>
          <small>${escapeHtml(p.mode)} · ${escapeHtml(p.status)}</small></div>
          <time datetime="${escapeHtml(p.createdAt)}">${new Date(p.createdAt).toLocaleString()}</time>
        </article>
      `).join("");
    });
  }

  function generate() {
    const input =
      $("#prompt") ||
      $('textarea[name="prompt"]') ||
      $('textarea[placeholder*="prompt" i]') ||
      $('input[name="prompt"]');

    const prompt = input ? input.value.trim() : "";
    if (!prompt) {
      notify("Enter a prompt before starting a generation.", "error");
      input?.focus();
      return;
    }
    if (state.credits < 10) {
      notify("You need more credits to start this generation.", "error");
      return;
    }

    state.credits -= 10;
    state.projects.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: prompt.slice(0, 60) || "Untitled project",
      mode: state.mode,
      createdAt: new Date().toISOString(),
      status: "Queued"
    });
    save();
    updateCredits();
    if (input) input.value = "";
    renderProjects();
    notify("Generation queued. Connect a secure AI backend to produce the final video.");
  }

  function init() {
    $$("[data-mode]").forEach(btn =>
      btn.addEventListener("click", () => setMode(btn.dataset.mode))
    );

    $$("[data-generate], #generate, #generateBtn, [data-action='generate']")
      .forEach(btn => btn.addEventListener("click", generate));

    $$("[data-action='clear']").forEach(btn =>
      btn.addEventListener("click", () => {
        $$("textarea, input[type='text'], input[name='prompt']").forEach(el => el.value = "");
        notify("Editor cleared.");
      })
    );

    $$("input[type='file']").forEach(input => {
      input.addEventListener("change", () => {
        state.files = [...input.files];
        const target = input.closest("label")?.querySelector("[data-file-name]") || $("[data-file-name]");
        if (target) target.textContent = state.files.map(f => f.name).join(", ") || "No files selected";
        if (state.files.length) notify(`${state.files.length} file${state.files.length === 1 ? "" : "s"} selected.`);
      });
    });

    $$("select[data-language], #language, select[name='language']").forEach(select => {
      select.value = state.language;
      select.addEventListener("change", () => {
        state.language = select.value;
        save();
        $$("select[data-language], #language, select[name='language']").forEach(s => s.value = state.language);
        notify(`Language changed to ${state.language}.`);
      });
    });

    $$("[data-action='upgrade'], [data-upgrade]").forEach(btn =>
      btn.addEventListener("click", () => notify("Connect your secure billing backend before accepting payments."))
    );

    $$("[data-action='login'], [data-login]").forEach(btn =>
      btn.addEventListener("click", () => notify("Connect authentication through a secure backend."))
    );

    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        generate();
      }
    });

    updateCredits();
    setMode(state.mode);
    renderProjects();
    window.HamdanAI = { state, notify, generate, setMode, renderProjects };
    document.documentElement.dataset.hamdanReady = "true";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
