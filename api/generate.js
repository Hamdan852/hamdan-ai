import { engineConfigured, startGeneration } from "./engine.js";

// The current self-hosted engine implements Text -> Video only.
// Keep other dashboard modes visible in the UI, but reject them here until their
// dedicated adapters are actually implemented.
const LIVE_MODES = new Set(["text"]);

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

function dimensions(format, resolution) {
  const portrait = format === "9:16 Portrait";
  const square = format === "1:1 Square";
  const fourK = resolution === "4K";
  const landscape = fourK ? 3840 : resolution === "720p" ? 1280 : 1920;
  const height = fourK ? 2160 : resolution === "720p" ? 720 : 1080;
  if (portrait) return { width: height, height: landscape };
  if (square) return { width: height, height };
  return { width: landscape, height };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return json(res, 400, { error: "invalid_json" });
  }

  const prompt = String(body?.prompt || "").trim();
  const mode = String(body?.mode || "text");
  if (!prompt) return json(res, 400, { error: "prompt_required" });
  if (prompt.length > 5000) {
    return json(res, 400, { error: "prompt_too_long", message: "Prompt must be 5000 characters or fewer." });
  }

  if (!LIVE_MODES.has(mode)) {
    return json(res, 501, {
      error: "mode_not_ready",
      message: "This mode is visible in the Hamdan dashboard but is not enabled by the current self-hosted engine yet. Text to Video is the first live engine target."
    });
  }

  if (!engineConfigured()) {
    return json(res, 503, {
      error: "engine_not_configured",
      message: "Hamdan AI is ready, but its private video engine has not been connected yet."
    });
  }

  const format = String(body?.format || "16:9 Landscape");
  const resolution = String(body?.resolution || "1080p");

  const payload = {
    prompt,
    mode,
    title: String(body?.title || "Hamdan AI Video").slice(0, 120),
    format,
    resolution,
    dimensions: dimensions(format, resolution),
    duration: String(body?.duration || "30 seconds"),
    language: String(body?.language || "English"),
    category: String(body?.category || "Custom")
  };

  try {
    const job = await startGeneration(payload);
    return json(res, 200, {
      ok: true,
      provider: "hamdan-private-engine",
      video_id: job.job_id,
      status: job.status || "queued"
    });
  } catch (error) {
    return json(res, error?.code === "engine_not_configured" ? 503 : 502, {
      error: error?.code || "engine_error",
      message: error?.message || "Hamdan's private video engine could not start the generation.",
      provider: error?.provider || null
    });
  }
}
