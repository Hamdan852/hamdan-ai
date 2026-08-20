const ALLOWED_MODES = new Set(["text", "script", "avatar"]);

// Safe defaults: these are public HeyGen avatar/voice IDs, not secrets.
// The owner can override them with Vercel environment variables.
const DEFAULT_AVATAR_ID = "Daphne_public_1";
const DEFAULT_VOICE_ID = "812d4eea4a8442a382dcaf2dbaddbd93";

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
  if (!apiKey) {
    return json(res, 503, {
      error: "provider_not_configured",
      message: "Hamdan AI is deployed, but HEYGEN_API_KEY is not configured in the Vercel production environment."
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
  if (prompt.length > 5000) {
    return json(res, 400, {
      error: "prompt_too_long",
      message: "Prompt must be 5000 characters or fewer."
    });
  }

  if (!ALLOWED_MODES.has(mode)) {
    return json(res, 501, {
      error: "mode_not_ready",
      message: "The first production provider is ready for Text → Video, Script → Video and Avatar → Video. Image, Audio, Video and 3D provider adapters are planned next."
    });
  }

  const avatarId = process.env.HEYGEN_AVATAR_ID || DEFAULT_AVATAR_ID;
  const voiceId = process.env.HEYGEN_VOICE_ID || DEFAULT_VOICE_ID;
  const format = String(body?.format || "16:9 Landscape");
  const resolution = String(body?.resolution || "1080p");

  const payload = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: avatarId,
          avatar_style: "normal"
        },
        voice: {
          type: "text",
          input_text: prompt,
          voice_id: voiceId,
          speed: 1
        }
      }
    ],
    dimension: dimensions(format, resolution),
    title: String(body?.title || "Hamdan AI Video").slice(0, 120)
  };

  try {
    const upstream = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !data?.data?.video_id) {
      return json(res, 502, {
        error: "provider_error",
        message: data?.message || data?.error?.message || "HeyGen did not return a video ID.",
        provider: data
      });
    }

    return json(res, 200, {
      ok: true,
      provider: "heygen",
      video_id: data.data.video_id,
      status: "pending"
    });
  } catch (error) {
    return json(res, 502, {
      error: "provider_unreachable",
      message: error?.message || "Video provider could not be reached."
    });
  }
}
