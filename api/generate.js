const ALLOWED_MODES = new Set(["text", "script", "avatar"]);

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

  const apiKey = process.env.HEYGEN_API_KEY;
  const avatarId = process.env.HEYGEN_AVATAR_ID;
  const voiceId = process.env.HEYGEN_VOICE_ID;

  if (!apiKey || !avatarId || !voiceId) {
    return json(res, 503, {
      error: "provider_not_configured",
      message: "Phase 2 backend is installed, but HEYGEN_API_KEY, HEYGEN_AVATAR_ID and HEYGEN_VOICE_ID are not configured on the backend yet."
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return json(res, 400, { error: "invalid_json" });
  }

  const prompt = String(body?.prompt || "").trim();
  const mode = String(body?.mode || "text");
  if (!prompt) return json(res, 400, { error: "prompt_required" });
  if (prompt.length > 5000) return json(res, 400, { error: "prompt_too_long", message: "Prompt must be 5000 characters or fewer." });
  if (!ALLOWED_MODES.has(mode)) {
    return json(res, 501, {
      error: "mode_not_ready",
      message: "This Phase 2 provider currently supports Text → Video, Script → Video and Avatar → Video. Image, Audio, Video and 3D providers will be added next."
    });
  }

  const inputText = mode === "avatar" ? prompt : prompt;
  const payload = {
    video_inputs: [
      {
        character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
        voice: { type: "text", input_text: inputText, voice_id: voiceId, speed: 1 }
      }
    ],
    dimension: dimensions(body?.format, body?.resolution),
    title: String(body?.title || "Hamdan AI Video").slice(0, 120)
  };

  try {
    const upstream = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !data?.data?.video_id) {
      return json(res, 502, { error: "provider_error", message: data?.message || "HeyGen did not return a video ID.", provider: data });
    }
    return json(res, 200, { ok: true, provider: "heygen", video_id: data.data.video_id, status: "pending" });
  } catch (error) {
    return json(res, 502, { error: "provider_unreachable", message: error?.message || "Video provider could not be reached." });
  }
}
