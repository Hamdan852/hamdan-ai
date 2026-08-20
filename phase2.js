/* Hamdan AI — production provider bridge */
(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const apiBase = (window.HAMDAN_API_BASE || "").replace(/\/$/, "");

  function notify(message, type = "info") {
    const box = $("#toast");
    if (!box) return;
    box.textContent = message;
    box.className = `toast show ${type}`;
    clearTimeout(box._phase2Timer);
    box._phase2Timer = setTimeout(() => box.classList.remove("show"), 5000);
  }

  function readSettings() {
    return {
      format: $("#format")?.value || "16:9 Landscape",
      resolution: $("#resolution")?.value || "1080p",
      duration: $("#duration")?.value || "30 seconds",
      language: $("#language")?.value || "English",
      voice: $("#voice")?.value || "Natural (Male)",
      style: $("#style")?.value || "Cinematic"
    };
  }

  function getMode() {
    const active = document.querySelector("[data-mode].active");
    return active?.dataset.mode || "text";
  }

  function showResult(videoUrl, thumbnailUrl, statusText) {
    const box = $("#previewBox");
    if (!box) return;
    if (videoUrl) {
      box.innerHTML = `<video id="hamdanGeneratedVideo" controls playsinline poster="${thumbnailUrl || ""}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;background:#050816"><source src="${videoUrl}" type="video/mp4"></video>`;
      $("#previewTitle").textContent = "Generated video";
      $("#previewText").textContent = "Your Hamdan AI video is ready.";
    } else {
      const text = $("#previewText");
      if (text) text.textContent = statusText || "Generating your video…";
    }
  }

  function addProject(prompt, mode, settings, status) {
    try {
      const key = "hamdan.phase1";
      const saved = JSON.parse(localStorage.getItem(key) || "null") || {};
      const projects = Array.isArray(saved.projects) ? saved.projects : [];
      projects.unshift({
        id: `${Date.now()}`,
        title: prompt.slice(0, 70),
        mode,
        category: saved.category || "Custom",
        status,
        createdAt: new Date().toISOString(),
        settings
      });
      saved.projects = projects.slice(0, 50);
      localStorage.setItem(key, JSON.stringify(saved));
    } catch (_) {}
  }

  async function requestGeneration() {
    const promptBox = $("#prompt");
    const prompt = promptBox?.value.trim();
    if (!prompt) {
      notify("Please enter a video idea or script first.", "error");
      promptBox?.focus();
      return;
    }

    const button = $("#generateBtn");
    const original = button?.textContent || "Generate Video";
    if (button) {
      button.disabled = true;
      button.textContent = "⏳ Starting AI generation…";
    }
    showResult(null, null, "Connecting to the Hamdan AI generation engine…");

    try {
      const settings = readSettings();
      const mode = getMode();
      const response = await fetch(`${apiBase}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode,
          ...settings,
          title: prompt.slice(0, 80)
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || `Generation request failed (${response.status}).`);

      promptBox.value = "";
      const count = $("#charCount");
      if (count) count.textContent = "0 / 2000";
      addProject(prompt, mode, settings, "Processing");
      notify("AI video generation started.", "success");
      showResult(null, null, "Your video is being generated…");
      await poll(data.video_id, button, original);
    } catch (error) {
      notify(error.message || "Could not start AI generation.", "error");
      showResult(null, null, error.message || "Generation could not be started.");
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    }
  }

  async function poll(videoId, button, original) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const response = await fetch(`${apiBase}/api/status?id=${encodeURIComponent(videoId)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || "Could not read generation status.");

      const status = String(data.status || "").toLowerCase();
      showResult(data.video_url, data.thumbnail_url, `Generation status: ${data.status || "processing"}…`);
      if (button) button.textContent = `⏳ ${data.status || "Processing"}…`;

      if (status === "completed" || status === "complete" || data.video_url) {
        notify("Your Hamdan AI video is ready!", "success");
        if (button) {
          button.disabled = false;
          button.textContent = "✨ Generate Video";
        }
        return;
      }
      if (status === "failed" || status === "error") {
        throw new Error(data.error || "The video provider reported a generation failure.");
      }
    }
    throw new Error("Generation is still processing. You can check the video again shortly.");
  }

  function init() {
    const button = $("#generateBtn");
    if (!button) return;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      requestGeneration();
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
