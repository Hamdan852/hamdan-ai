/* Hamdan AI — production-ready browser controller */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = "hamdan.phase1";
  const API_GENERATE = "/api/generate";
  const API_STATUS = "/api/status";
  const API_ASSISTANT = "/api/assistant";
  const API_LEAD = "/api/lead";

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch { saved = {}; }
  const state = Object.assign({
    mode: "text", workflow: "simple", category: "Custom", language: "English", credits: 120,
    projects: [], promoPlaying: false, promoMuted: true, library: [], assistantHistory: []
  }, saved);

  const modeMeta = {
    text: { name: "Text to Video", hint: "Describe your video and Hamdan AI will prepare the workflow.", placeholder: "Describe the video you want to create…\nExample: Create a cinematic 30-second travel video about the mountains of Pakistan.", upload: false },
    image: { name: "Image to Video", hint: "Upload an image and describe the motion or story you want.", placeholder: "Describe how you want the image to move…", upload: true, title: "Upload an image", help: "PNG, JPG or WEBP", accept: "image/*" },
    audio: { name: "Audio to Video", hint: "Upload audio and describe the visuals that should accompany it.", placeholder: "Describe the visuals for your audio…", upload: true, title: "Upload audio", help: "MP3, WAV or M4A", accept: "audio/*" },
    video: { name: "Video to Video", hint: "Upload a source video and describe the transformation.", placeholder: "Describe the changes you want…", upload: true, title: "Upload video", help: "MP4, MOV or WEBM", accept: "video/*" },
    avatar: { name: "Avatar to Video", hint: "Choose an avatar workflow and write what the presenter should say.", placeholder: "Write the presenter script…", upload: false },
    script: { name: "Script to Video", hint: "Paste your script and choose the visual style.", placeholder: "Paste your video script here…", upload: false },
    "3d": { name: "3D to Video", hint: "Describe the 3D scene, object or animation you want.", placeholder: "Describe your 3D scene…", upload: true, title: "Upload 3D asset (optional)", help: "GLB, GLTF, FBX or image reference", accept: ".glb,.gltf,.fbx,image/*" },
    multi: { name: "Multi-Input", hint: "Combine a prompt with image, audio or video inputs.", placeholder: "Describe how all your inputs should work together…", upload: true, title: "Add media inputs", help: "Images, audio and video", accept: "image/*,audio/*,video/*" }
  };

  const languageLocales = { English: "en-US", Urdu: "ur-PK", Arabic: "ar-SA", Spanish: "es-ES", French: "fr-FR", Chinese: "zh-CN", Hindi: "hi-IN", Turkish: "tr-TR" };

  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }
  function notify(message, type = "info") {
    const box = $("#toast"); if (!box) return;
    box.textContent = message; box.className = `toast show ${type}`;
    clearTimeout(box._timer); box._timer = setTimeout(() => box.classList.remove("show"), 3200);
  }

  function setMode(mode, silent = false) {
    state.mode = mode; const meta = modeMeta[mode] || modeMeta.text;
    $$("[data-mode]").forEach(btn => btn.classList.toggle("active", btn.dataset.mode === mode));
    $("#currentMode").textContent = meta.name; $("#modeSummary").textContent = meta.name.replace(" to ", " → ");
    $("#previewMode").textContent = meta.name.replace(" to ", " → "); $("#modeHint").textContent = meta.hint;
    $("#prompt").placeholder = meta.placeholder; $("#uploadPanel").hidden = !meta.upload;
    if (meta.upload) { $("#uploadTitle").textContent = meta.title; $("#uploadHelp").textContent = meta.help; $("#mediaInput").accept = meta.accept; }
    if (!silent) notify(`${meta.name} selected.`); save();
  }

  function setWorkflow(workflow) {
    state.workflow = workflow; $$("[data-workflow]").forEach(btn => btn.classList.toggle("selected", btn.dataset.workflow === workflow)); save();
    notify(`${workflow[0].toUpperCase() + workflow.slice(1)} Mode selected.`);
  }
  function updateCredits() { $("#creditSummary").textContent = state.credits; }
  function updatePromptCount() { $("#charCount").textContent = `${$("#prompt").value.length} / 5000`; }

  function renderProjects() {
    const box = $("#projectsList"); if (!box) return;
    if (!state.projects.length) { box.innerHTML = '<div class="empty">No projects yet. Generate your first video above.</div>'; return; }
    box.innerHTML = state.projects.map(p => `<article class="project-card"><div class="project-icon">${p.status === "Processing" || p.status === "Submitting" ? "⏳" : p.status === "Failed" ? "!" : "✓"}</div><div><b>${escapeHtml(p.title)}</b><small>${escapeHtml(p.mode)} · ${escapeHtml(p.category)} · ${new Date(p.createdAt).toLocaleString()}</small></div><span>${p.videoUrl ? `<a href="${escapeHtml(p.videoUrl)}" target="_blank" rel="noopener">Watch</a>` : escapeHtml(p.status)}</span></article>`).join("");
  }
  function renderLibrary() { $("#libraryFiles").innerHTML = (state.library || []).map(name => `<span class="library-file">📄 ${escapeHtml(name)}</span>`).join(""); }
  function setProjectStatus(id, status, extra = {}) { const p = state.projects.find(x => x.id === id); if (!p) return; Object.assign(p, { status, ...extra }); renderProjects(); save(); }

  async function pollVideo(projectId, videoId) {
    for (let attempt = 0; attempt < 45; attempt++) {
      await new Promise(r => setTimeout(r, 4000));
      try {
        const response = await fetch(`${API_STATUS}?id=${encodeURIComponent(videoId)}`, { headers: { accept: "application/json" }, cache: "no-store" });
        const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || data.error || "Status check failed.");
        const status = String(data.status || "unknown").toLowerCase();
        if (["completed", "complete", "ready", "success"].includes(status)) { setProjectStatus(projectId, "Completed", { videoUrl: data.video_url || null, thumbnailUrl: data.thumbnail_url || null }); notify("Your AI video is ready. Open My Projects to watch it.", "success"); return; }
        if (["failed", "error", "failure"].includes(status)) { setProjectStatus(projectId, "Failed", { error: data.error || "Video generation failed." }); notify(data.error || "Video generation failed.", "error"); return; }
        setProjectStatus(projectId, "Processing");
      } catch (e) { setProjectStatus(projectId, "Processing", { statusMessage: e?.message || "Checking provider status…" }); }
    }
    notify("The video is still processing. You can continue using Hamdan AI.");
  }

  async function generate() {
    const prompt = $("#prompt").value.trim();
    if (!prompt) return notify("Please enter a video idea or script first.", "error");
    if (prompt.length > 5000) return notify("Your prompt is too long.", "error");
    if (state.credits < 10) return notify("Not enough credits for this generation.", "error");
    if (!["text", "script", "avatar"].includes(state.mode)) return notify("This mode is displayed in the dashboard but its production engine adapter is not connected yet.", "error");
    const project = { id: `${Date.now()}`, title: prompt.slice(0, 70), mode: modeMeta[state.mode].name, category: state.category, status: "Submitting", createdAt: new Date().toISOString() };
    state.projects.unshift(project); renderProjects(); save(); notify("Sending your request to the Hamdan AI video engine…");
    try {
      const response = await fetch(API_GENERATE, { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify({ prompt, mode: state.mode, title: project.title, format: $("#format")?.value || "16:9 Landscape", resolution: $("#resolution")?.value || "1080p", duration: $("#duration")?.value || "30 seconds", language: state.language, category: state.category }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || data.error || `Generation request failed (${response.status}).`);
      if (!data.video_id) throw new Error("The video engine did not return a video ID.");
      state.credits -= 10; Object.assign(project, { status: "Processing", videoId: data.video_id, provider: data.provider || "hamdan-private-engine" });
      $("#prompt").value = ""; updatePromptCount(); updateCredits(); renderProjects(); save(); notify("Generation started.", "success"); location.hash = "projects"; pollVideo(project.id, data.video_id);
    } catch (error) { state.projects = state.projects.filter(p => p.id !== project.id); renderProjects(); save(); notify(error?.message || "Could not start video generation.", "error"); }
  }

  function fillTemplate(kind) {
    const templates = { cinematic: "Create a cinematic 30-second video with dramatic lighting, smooth camera movement, atmospheric music and a premium international look.", social: "Create a short vertical social-media video with a strong hook, fast visual pacing, captions and a clear call to action.", business: "Create a professional business explainer video with clean visuals, confident narration, modern motion graphics and a strong closing message." };
    $("#prompt").value = templates[kind] || ""; updatePromptCount(); $("#prompt").focus();
  }

  function setupPromo() {
    const player = $("#promoPlayer"); $("#promoPlay").addEventListener("click", () => { state.promoPlaying = !state.promoPlaying; player.classList.toggle("playing", state.promoPlaying); $("#promoPlay").textContent = state.promoPlaying ? "❚❚" : "▶"; $("#promoStatus").textContent = state.promoPlaying ? "Promo preview playing" : "Promo preview paused"; save(); });
    $("#promoMute").addEventListener("click", () => { state.promoMuted = !state.promoMuted; $("#promoMute").textContent = state.promoMuted ? "🔇" : "🔊"; notify(state.promoMuted ? "Promo sound muted." : "Promo sound enabled."); save(); });
  }

  function setupUploads() {
    $("#mediaInput").addEventListener("change", e => { const files = [...e.target.files]; $("#fileName").textContent = files.length ? files.map(f => f.name).join(", ") : "No file selected"; if (files.length) notify(`${files.length} file${files.length > 1 ? "s" : ""} selected.`); });
    $("#libraryInput").addEventListener("change", e => { const files = [...e.target.files]; state.library = [...new Set([...(state.library || []), ...files.map(f => f.name)])]; renderLibrary(); save(); if (files.length) notify(`${files.length} media file${files.length > 1 ? "s" : ""} added to your library.`); });
    const drop = $("#mediaDrop"); ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("dragging"); })); ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("dragging"); }));
    drop.addEventListener("drop", e => { const files = [...e.dataTransfer.files]; state.library = [...new Set([...(state.library || []), ...files.map(f => f.name)])]; renderLibrary(); save(); notify(`${files.length} media file${files.length > 1 ? "s" : ""} added.`); });
  }

  function businessIndustry() { return state.category === "Real Estate" ? "real-estate" : "general"; }

  function addAssistantControls() {
    const chat = $("#chat"), btn = $("#chatBtn"); if (!chat || !btn) return; const row = btn.parentElement; if (!row) return;
    if (!$("#chatMic", row)) { const mic = document.createElement("button"); mic.id = "chatMic"; mic.type = "button"; mic.title = "Speak"; mic.setAttribute("aria-label", "Speak to Hamdan AI"); mic.textContent = "🎙"; row.insertBefore(mic, btn); mic.addEventListener("click", startListening); }
    if (!$("#chatSpeak", row)) { const speak = document.createElement("button"); speak.id = "chatSpeak"; speak.type = "button"; speak.title = "Read the last answer aloud"; speak.setAttribute("aria-label", "Read answer aloud"); speak.textContent = "🔊"; row.insertBefore(speak, btn); speak.addEventListener("click", () => speakText($("#chatReply").textContent)); }
    if (!$("#leadBtn")) { const leadBtn = document.createElement("button"); leadBtn.id = "leadBtn"; leadBtn.type = "button"; leadBtn.className = "secondary-btn"; leadBtn.textContent = "📩 Talk to a human / Send my details"; const panel = $("#assistant"); panel.appendChild(leadBtn); leadBtn.addEventListener("click", showLeadForm); }
  }

  function speakText(text) { if (!text || !window.speechSynthesis) return notify("Voice playback is not supported by this browser.", "error"); window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = languageLocales[state.language] || "en-US"; window.speechSynthesis.speak(u); }
  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return notify("Voice input is not supported by this browser. You can still use the keyboard.", "error");
    const recognition = new Recognition(); recognition.lang = languageLocales[state.language] || "en-US"; recognition.interimResults = false; recognition.maxAlternatives = 1;
    const mic = $("#chatMic"); if (mic) mic.textContent = "⏺";
    recognition.onresult = e => { $("#chat").value = e.results[0][0].transcript; respondAssistant(); };
    recognition.onerror = () => { if (mic) mic.textContent = "🎙"; notify("Microphone input could not be used. Check browser microphone permission.", "error"); };
    recognition.onend = () => { if (mic) mic.textContent = "🎙"; };
    try { recognition.start(); notify("Listening… speak now."); } catch { if (mic) mic.textContent = "🎙"; }
  }

  function showLeadForm() {
    if ($("#leadForm")) { $("#leadName").focus(); return; }
    const panel = $("#assistant"); const form = document.createElement("form"); form.id = "leadForm"; form.className = "lead-form";
    form.innerHTML = `<h3>📩 Contact the business</h3><p>Your details are sent securely to the business after you give consent.</p><label>Name<input id="leadName" required maxlength="120" autocomplete="name"></label><label>Email<input id="leadEmail" required maxlength="240" type="email" autocomplete="email"></label><label>Phone <small>(optional)</small><input id="leadPhone" maxlength="40" type="tel" autocomplete="tel"></label><label>How can we help?<textarea id="leadMessage" required maxlength="2000" rows="3"></textarea></label><label class="consent"><input id="leadConsent" type="checkbox" required> I agree to send these details to the business so they can contact me.</label><input id="leadWebsite" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button class="primary" type="submit">Send securely</button><button id="leadCancel" type="button" class="secondary-btn">Cancel</button><div id="leadStatus" class="chat-reply"></div>`;
    panel.appendChild(form); $("#leadMessage").value = $("#chat").value.trim(); $("#leadCancel").addEventListener("click", () => form.remove()); form.addEventListener("submit", submitLead); $("#leadName").focus();
  }

  async function submitLead(e) {
    e.preventDefault(); const status = $("#leadStatus"); status.textContent = "Sending…";
    try {
      const response = await fetch(API_LEAD, { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify({ name: $("#leadName").value.trim(), email: $("#leadEmail").value.trim(), phone: $("#leadPhone").value.trim(), message: $("#leadMessage").value.trim(), consent: $("#leadConsent").checked, website: $("#leadWebsite").value, industry: businessIndustry(), language: state.language }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || data.error || "Could not send your information."); status.textContent = data.message || "Sent successfully."; notify("Your details were sent to the business.", "success");
    } catch (error) { status.textContent = error.message || "Could not send your information."; notify(status.textContent, "error"); }
  }

  async function respondAssistant() {
    const input = $("#chat"); const text = input.value.trim(); if (!text) return;
    const replyBox = $("#chatReply"); replyBox.textContent = "Hamdan AI is thinking…";
    const history = Array.isArray(state.assistantHistory) ? state.assistantHistory.slice(-8) : [];
    state.assistantHistory = [...history, { role: "user", content: text }].slice(-8); input.value = ""; save();
    try {
      const response = await fetch(API_ASSISTANT, { method: "POST", headers: { "Content-Type": "application/json", accept: "application/json" }, body: JSON.stringify({ message: text, history, language: state.language, industry: businessIndustry() }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || data.error || "AI assistant is unavailable.");
      const reply = data.reply || "I could not generate a response."; replyBox.textContent = reply; state.assistantHistory = [...state.assistantHistory, { role: "assistant", content: reply }].slice(-8); save(); speakText(reply);
      if (/contact|call me|human|agent|appointment|book|buy|sell|doctor|treatment|quote/i.test(text)) notify("You can use ‘Talk to a human / Send my details’ to contact the business.");
    } catch (error) { replyBox.textContent = error.message || "AI assistant is unavailable."; notify(replyBox.textContent, "error"); }
  }

  function setupAssistant() { addAssistantControls(); $("#chatBtn").addEventListener("click", respondAssistant); $("#chat").addEventListener("keydown", e => { if (e.key === "Enter") respondAssistant(); }); }

  function init() {
    $$("[data-mode]").forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));
    $$("[data-workflow]").forEach(btn => btn.addEventListener("click", () => setWorkflow(btn.dataset.workflow)));
    $$("[data-category]").forEach(btn => btn.addEventListener("click", () => { state.category = btn.dataset.category; $$("[data-category]").forEach(b => b.classList.toggle("selected", b === btn)); save(); notify(`${state.category} selected.`); }));
    $$("[data-prompt-template]").forEach(btn => btn.addEventListener("click", () => fillTemplate(btn.dataset.promptTemplate)));
    $$("[data-template]").forEach(btn => btn.addEventListener("click", () => { $("#prompt").value = `Create a ${btn.dataset.template} video with a polished international look.`; updatePromptCount(); $("#prompt").focus(); notify(`${btn.dataset.template} template loaded.`); }));
    $("#generateBtn").addEventListener("click", generate); $("#prompt").addEventListener("input", updatePromptCount); $("#clearPrompt").addEventListener("click", () => { $("#prompt").value = ""; updatePromptCount(); notify("Prompt cleared."); });
    $("#clearProjects").addEventListener("click", () => { state.projects = []; save(); renderProjects(); notify("Project history cleared."); });
    $("#servicesBtn").addEventListener("click", () => { location.hash = "assistant"; notify("Ask Hamdan AI for help below."); });
    $("#freePlan").addEventListener("click", () => notify("Free plan selected.")); $("#proPlan").addEventListener("click", () => notify("Real payments will be connected in the billing phase.")); $("#ownerMode").addEventListener("click", () => notify("Owner mode active — test credits are available."));
    $("#viewTemplates").addEventListener("click", () => notify("You are viewing the template library.")); $("#themeBtn").addEventListener("click", () => notify("Dark theme is the current Hamdan AI design.")); $("#resetBtn").addEventListener("click", () => { localStorage.removeItem(KEY); location.reload(); }); $("#notificationsBtn").addEventListener("click", () => notify("No new notifications."));
    $("#helpBtn").addEventListener("click", () => { location.hash = "assistant"; notify("Ask Hamdan AI for help below."); }); $("#languageBtn").addEventListener("click", () => { location.hash = "settings"; $("#language").focus(); });
    $("#language").addEventListener("change", e => { state.language = e.target.value; $("#languageLabel").textContent = e.target.value; save(); notify(`Interface language set to ${e.target.value}.`); });
    setupPromo(); setupUploads(); setupAssistant(); setMode(state.mode, true); setWorkflow(state.workflow); updateCredits(); updatePromptCount(); renderProjects(); renderLibrary(); $("#language").value = state.language; $("#languageLabel").textContent = state.language; document.documentElement.dataset.hamdanReady = "true";
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
