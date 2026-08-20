/* Hamdan AI — Phase 1 frontend application logic */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = "hamdan.phase1";

  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  const state = Object.assign({
    mode: "text",
    workflow: "simple",
    category: "Custom",
    language: "English",
    credits: 120,
    projects: [],
    promoPlaying: false,
    promoMuted: true,
    library: []
  }, saved || {});

  const modeMeta = {
    text: { name: "Text to Video", hint: "Describe your video and Hamdan AI will prepare the workflow.", placeholder: "Describe the video you want to create…\nExample: Create a cinematic 30-second travel video about the mountains of Pakistan.", upload: false },
    image: { name: "Image to Video", hint: "Upload an image and describe the motion or story you want.", placeholder: "Describe how you want the image to move…\nExample: Animate this landscape with a slow cinematic camera push-in.", upload: true, title: "Upload an image", help: "PNG, JPG or WEBP" },
    audio: { name: "Audio to Video", hint: "Upload audio and describe the visuals that should accompany it.", placeholder: "Describe the visuals for your audio…", upload: true, title: "Upload audio", help: "MP3, WAV or M4A" },
    video: { name: "Video to Video", hint: "Upload a source video and describe the transformation.", placeholder: "Describe the changes you want…", upload: true, title: "Upload video", help: "MP4, MOV or WEBM" },
    avatar: { name: "Avatar to Video", hint: "Choose an avatar workflow and write what the presenter should say.", placeholder: "Write the presenter script…", upload: false },
    script: { name: "Script to Video", hint: "Paste your script and choose the visual style.", placeholder: "Paste your video script here…", upload: false },
    "3d": { name: "3D to Video", hint: "Describe the 3D scene, object or animation you want.", placeholder: "Describe your 3D scene…\nExample: A futuristic city forming from glowing blue particles.", upload: true, title: "Upload 3D asset (optional)", help: "GLB, GLTF, FBX or image reference" },
    multi: { name: "Multi-Input", hint: "Combine a prompt with image, audio or video inputs.", placeholder: "Describe how all your inputs should work together…", upload: true, title: "Add media inputs", help: "Images, audio and video" }
  };

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function notify(message, type = "info") {
    const box = $("#toast");
    box.textContent = message;
    box.className = `toast show ${type}`;
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.classList.remove("show"), 3200);
  }

  function setMode(mode, silent = false) {
    state.mode = mode;
    const meta = modeMeta[mode] || modeMeta.text;
    $$("[data-mode]").forEach(btn => btn.classList.toggle("active", btn.dataset.mode === mode));
    $("#currentMode").textContent = meta.name;
    $("#modeSummary").textContent = meta.name.replace(" to ", " → ");
    $("#previewMode").textContent = meta.name.replace(" to ", " → ");
    $("#modeHint").textContent = meta.hint;
    $("#prompt").placeholder = meta.placeholder;
    $("#uploadPanel").hidden = !meta.upload;
    if (meta.upload) {
      $("#uploadTitle").textContent = meta.title;
      $("#uploadHelp").textContent = meta.help;
      const accept = mode === "image" ? "image/*" : mode === "audio" ? "audio/*" : mode === "video" ? "video/*" : mode === "3d" ? ".glb,.gltf,.fbx,image/*" : "image/*,audio/*,video/*";
      $("#mediaInput").accept = accept;
    }
    if (!silent) notify(`${meta.name} selected.`);
    save();
  }

  function setWorkflow(workflow) {
    state.workflow = workflow;
    $$("[data-workflow]").forEach(btn => btn.classList.toggle("selected", btn.dataset.workflow === workflow));
    notify(`${workflow[0].toUpperCase() + workflow.slice(1)} Mode selected.`);
  }

  function updateCredits() {
    $("#creditSummary").textContent = state.credits;
  }

  function updatePromptCount() {
    $("#charCount").textContent = `${$("#prompt").value.length} / 2000`;
  }

  function renderProjects() {
    const box = $("#projectsList");
    if (!state.projects.length) {
      box.innerHTML = '<div class="empty">No projects yet. Generate your first video above.</div>';
      return;
    }
    box.innerHTML = state.projects.map(p => `
      <article class="project-card">
        <div class="project-icon">${p.status === "Queued" ? "⏳" : "✓"}</div>
        <div><b>${escapeHtml(p.title)}</b><small>${escapeHtml(p.mode)} · ${escapeHtml(p.category)} · ${new Date(p.createdAt).toLocaleString()}</small></div>
        <span>${escapeHtml(p.status)}</span>
      </article>`).join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  }

  function generate() {
    const prompt = $("#prompt").value.trim();
    if (!prompt) {
      notify("Please enter a video idea or script first.", "error");
      $("#prompt").focus();
      return;
    }
    if (state.credits < 10) {
      notify("Not enough credits for this test generation.", "error");
      return;
    }
    state.credits -= 10;
    state.projects.unshift({
      id: `${Date.now()}`,
      title: prompt.slice(0, 70),
      mode: modeMeta[state.mode].name,
      category: state.category,
      status: "Queued",
      createdAt: new Date().toISOString()
    });
    $("#previewTitle").textContent = prompt.slice(0, 52);
    $("#previewText").textContent = `${modeMeta[state.mode].name} · ${$("#duration").value} · ${$("#resolution").value}`;
    $("#prompt").value = "";
    updatePromptCount();
    updateCredits();
    renderProjects();
    save();
    notify("Project queued successfully. The real AI generation engine will be connected in Phase 2.");
    location.hash = "projects";
  }

  function fillTemplate(kind) {
    const templates = {
      cinematic: "Create a cinematic 30-second video with dramatic lighting, smooth camera movement, atmospheric music and a premium international look.",
      social: "Create a short vertical social-media video with a strong hook, fast visual pacing, captions and a clear call to action.",
      business: "Create a professional business explainer video with clean visuals, confident narration, modern motion graphics and a strong closing message."
    };
    $("#prompt").value = templates[kind];
    updatePromptCount();
    $("#prompt").focus();
  }

  function setupPromo() {
    const player = $("#promoPlayer");
    $("#promoPlay").addEventListener("click", () => {
      state.promoPlaying = !state.promoPlaying;
      player.classList.toggle("playing", state.promoPlaying);
      $("#promoPlay").textContent = state.promoPlaying ? "❚❚" : "▶";
      $("#promoStatus").textContent = state.promoPlaying ? "Promo preview playing" : "Promo preview paused";
      save();
    });
    $("#promoMute").addEventListener("click", () => {
      state.promoMuted = !state.promoMuted;
      $("#promoMute").textContent = state.promoMuted ? "🔇" : "🔊";
      notify(state.promoMuted ? "Promo sound muted." : "Promo sound enabled. Audio will be connected with the production video in Phase 2.");
      save();
    });
  }

  function setupUploads() {
    $("#mediaInput").addEventListener("change", e => {
      const files = [...e.target.files];
      $("#fileName").textContent = files.length ? files.map(f => f.name).join(", ") : "No file selected";
      if (files.length) notify(`${files.length} file${files.length > 1 ? "s" : ""} selected.`);
    });
    $("#libraryInput").addEventListener("change", e => {
      const files = [...e.target.files];
      state.library = [...new Set([...(state.library || []), ...files.map(f => f.name)])];
      renderLibrary();
      save();
      if (files.length) notify(`${files.length} media file${files.length > 1 ? "s" : ""} added to your library.`);
    });
    const drop = $("#mediaDrop");
    ["dragenter", "dragover"].forEach(event => drop.addEventListener(event, e => { e.preventDefault(); drop.classList.add("dragging"); }));
    ["dragleave", "drop"].forEach(event => drop.addEventListener(event, e => { e.preventDefault(); drop.classList.remove("dragging"); }));
    drop.addEventListener("drop", e => {
      const files = [...e.dataTransfer.files];
      state.library = [...new Set([...(state.library || []), ...files.map(f => f.name)])];
      renderLibrary(); save();
      notify(`${files.length} media file${files.length > 1 ? "s" : ""} added.`);
    });
  }

  function renderLibrary() {
    $("#libraryFiles").innerHTML = (state.library || []).map(name => `<span class="library-file">📄 ${escapeHtml(name)}</span>`).join("");
  }

  function setupAssistant() {
    const respond = () => {
      const text = $("#chat").value.trim();
      if (!text) return;
      const lower = text.toLowerCase();
      let reply = "I can help you choose a workflow. Try saying: 'make a cinematic video', 'image to video', or 'social media video'.";
      if (lower.includes("image")) { setMode("image"); reply = "Image → Video selected. Upload an image and describe the motion you want."; }
      else if (lower.includes("audio")) { setMode("audio"); reply = "Audio → Video selected. Upload your audio and describe the visuals."; }
      else if (lower.includes("social")) { $("[data-category='Social Media']").click(); reply = "Social Media category selected. I recommend a short vertical format."; }
      else if (lower.includes("cinematic")) { $("[data-category='Cinematic']").click(); reply = "Cinematic category selected. I recommend 16:9, 1080p and the Cinematic style."; }
      $("#chatReply").textContent = reply;
      $("#chat").value = "";
    };
    $("#chatBtn").addEventListener("click", respond);
    $("#chat").addEventListener("keydown", e => { if (e.key === "Enter") respond(); });
  }

  function init() {
    $$("[data-mode]").forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));
    $$("[data-workflow]").forEach(btn => btn.addEventListener("click", () => setWorkflow(btn.dataset.workflow)));
    $$("[data-category]").forEach(btn => btn.addEventListener("click", () => { state.category = btn.dataset.category; $$("[data-category]").forEach(b => b.classList.toggle("selected", b === btn)); notify(`${state.category} selected.`); save(); }));
    $$("[data-prompt-template]").forEach(btn => btn.addEventListener("click", () => fillTemplate(btn.dataset.promptTemplate)));
    $$("[data-template]").forEach(btn => btn.addEventListener("click", () => { $("#prompt").value = `Create a ${btn.dataset.template} video with a polished international look.`; updatePromptCount(); $("#prompt").focus(); notify(`${btn.dataset.template} template loaded.`); }));
    $("#generateBtn").addEventListener("click", generate);
    $("#prompt").addEventListener("input", updatePromptCount);
    $("#clearPrompt").addEventListener("click", () => { $("#prompt").value = ""; updatePromptCount(); notify("Prompt cleared."); });
    $("#clearProjects").addEventListener("click", () => { state.projects = []; save(); renderProjects(); notify("Project history cleared."); });
    $("#servicesBtn").addEventListener("click", () => notify("Services Center is ready for the backend support system in Phase 2."));
    $("#freePlan").addEventListener("click", () => notify("Free plan selected."));
    $("#proPlan").addEventListener("click", () => notify("Real payments will be connected in the billing phase."));
    $("#ownerMode").addEventListener("click", () => notify("Owner mode active — test credits are available."));
    $("#viewTemplates").addEventListener("click", () => notify("You are viewing the Phase 1 template library."));
    $("#themeBtn").addEventListener("click", () => notify("Dark theme is the current Hamdan AI design."));
    $("#resetBtn").addEventListener("click", () => { localStorage.removeItem(KEY); location.reload(); });
    $("#notificationsBtn").addEventListener("click", () => notify("No new notifications."));
    $("#helpBtn").addEventListener("click", () => { location.hash = "assistant"; notify("Ask Hamdan AI for help below."); });
    $("#languageBtn").addEventListener("click", () => { location.hash = "settings"; $("#language").focus(); });
    $("#language").addEventListener("change", e => { state.language = e.target.value; $("#languageLabel").textContent = e.target.value; save(); notify(`Interface language set to ${e.target.value}.`); });
    setupPromo();
    setupUploads();
    setupAssistant();
    setMode(state.mode, true);
    setWorkflow(state.workflow);
    updateCredits();
    updatePromptCount();
    renderProjects();
    renderLibrary();
    $("#language").value = state.language;
    $("#languageLabel").textContent = state.language;
    document.documentElement.dataset.hamdanReady = "true";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();