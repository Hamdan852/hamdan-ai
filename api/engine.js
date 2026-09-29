const ENGINE_URL = String(process.env.HAMDAN_ENGINE_URL || "").trim().replace(/\/$/, "");
const ENGINE_TOKEN = String(process.env.HAMDAN_ENGINE_TOKEN || "").trim();
const HEYGEN_API_KEY = String(process.env.HEYGEN_API_KEY || "").trim();
const HEYGEN_URL = "https://api.heygen.com";
const PREFERRED_PROVIDER = String(process.env.HAMDAN_ENGINE_PROVIDER || "").trim().toLowerCase();

function activeProvider() {
  if (PREFERRED_PROVIDER === "private" && ENGINE_URL) return "hamdan-private-engine";
  if (PREFERRED_PROVIDER === "heygen" && HEYGEN_API_KEY) return "heygen-video-agent";
  if (HEYGEN_API_KEY) return "heygen-video-agent";
  if (ENGINE_URL) return "hamdan-private-engine";
  return null;
}

function authHeaders() {
  const headers = { accept: "application/json" };
  if (ENGINE_TOKEN) headers.authorization = `Bearer ${ENGINE_TOKEN}`;
  return headers;
}

function heygenHeaders() {
  return {
    accept: "application/json",
    "Content-Type": "application/json",
    "X-Api-Key": HEYGEN_API_KEY
  };
}

export function engineConfigured() {
  return Boolean(activeProvider());
}

export function engineProvider() {
  return activeProvider();
}

function heygenOrientation(format) {
  return format === "9:16 Portrait" ? "portrait" : "landscape";
}

function heygenPrompt(payload) {
  return [
    payload.prompt,
    `Create this as a polished ${payload.duration} video.`,
    `Format: ${payload.format}.`,
    `Target resolution: ${payload.resolution}.`,
    `Language: ${payload.language}.`,
    `Category/style: ${payload.category}.`,
    "Use professional pacing, coherent scenes, clean typography where appropriate, and production-ready visuals."
  ].join("\n\n");
}

async function startHeyGenGeneration(payload) {
  const response = await fetch(`${HEYGEN_URL}/v3/video-agents`, {
    method: "POST",
    headers: heygenHeaders(),
    body: JSON.stringify({
      prompt: heygenPrompt(payload),
      orientation: heygenOrientation(payload.format),
      incognito_mode: true
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.message || data?.error || `HeyGen rejected the request (${response.status}).`;
    const error = new Error(message);
    error.code = response.status === 401 ? "heygen_unauthorized" : "engine_error";
    error.status = response.status;
    error.provider = "heygen";
    throw error;
  }

  const result = data?.data || {};
  const videoId = result.video_id || null;
  const sessionId = result.session_id || null;
  if (!videoId && !sessionId) {
    const error = new Error("HeyGen accepted the request but returned neither a video ID nor a session ID.");
    error.code = "engine_error";
    error.provider = "heygen";
    throw error;
  }

  return {
    job_id: videoId ? `heygen-video:${videoId}` : `heygen-session:${sessionId}`,
    status: result.status || "pending"
  };
}

async function getHeyGenGenerationStatus(jobId) {
  const value = String(jobId || "");
  if (value.startsWith("heygen-session:")) {
    const sessionId = value.slice("heygen-session:".length);
    const response = await fetch(`${HEYGEN_URL}/v3/video-agents/${encodeURIComponent(sessionId)}`, {
      headers: { accept: "application/json", "X-Api-Key": HEYGEN_API_KEY },
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error?.message || data?.message || `HeyGen session status failed (${response.status}).`);
      error.code = "engine_error";
      error.status = response.status;
      error.provider = "heygen";
      throw error;
    }

    const result = data?.data || {};
    if (result.video_id) {
      return getHeyGenGenerationStatus(`heygen-video:${result.video_id}`);
    }

    return {
      status: result.status || "processing",
      error: result.failure_message || null
    };
  }

  const videoId = value.startsWith("heygen-video:") ? value.slice("heygen-video:".length) : value;
  const response = await fetch(`${HEYGEN_URL}/v3/videos/${encodeURIComponent(videoId)}`, {
    headers: { accept: "application/json", "X-Api-Key": HEYGEN_API_KEY },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.message || `HeyGen video status failed (${response.status}).`);
    error.code = response.status === 401 ? "heygen_unauthorized" : "engine_error";
    error.status = response.status;
    error.provider = "heygen";
    throw error;
  }

  return data?.data || {};
}

export async function startGeneration(payload) {
  const provider = activeProvider();
  if (provider === "hamdan-private-engine") {
    const response = await fetch(`${ENGINE_URL}/generate`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.job_id) {
      const error = new Error(data?.message || data?.error || `Hamdan engine rejected the request (${response.status}).`);
      error.code = "engine_error";
      error.status = response.status;
      error.provider = data;
      throw error;
    }

    return data;
  }

  if (provider === "heygen-video-agent") return startHeyGenGeneration(payload);

  const error = new Error("No video engine is configured.");
  error.code = "engine_not_configured";
  throw error;
}

export async function getGenerationStatus(jobId) {
  const provider = activeProvider();
  if (provider === "hamdan-private-engine") {
    const response = await fetch(`${ENGINE_URL}/status/${encodeURIComponent(jobId)}`, {
      headers: authHeaders(),
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.message || data?.error || `Hamdan engine status failed (${response.status}).`);
      error.code = "engine_error";
      error.status = response.status;
      error.provider = data;
      throw error;
    }

    return data;
  }

  if (provider === "heygen-video-agent") return getHeyGenGenerationStatus(jobId);

  const error = new Error("No video engine is configured.");
  error.code = "engine_not_configured";
  throw error;
}
