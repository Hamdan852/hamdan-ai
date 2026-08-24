/* Hamdan AI — Phase 1 frontend application logic */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = "hamdan.phase1";
  const API_GENERATE = "/api/generate";
  const API_STATUS = "/api/status";

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
  }, saved || {});

  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

  // Existing Phase 1 application behavior is initialized by the page below.
  function boot() {
    // Keep the Developer integration independent from the video-generation state.
    const script = document.createElement("script");
    script.src = "/developer-sidebar-integration.js";
    script.defer = true;
    document.body.appendChild(script);
  }

  document.addEventListener("DOMContentLoaded", boot, { once: true });
  save();
})();
