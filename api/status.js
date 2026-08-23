import { engineConfigured, getGenerationStatus } from "./engine.js";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });
  const id = String(req.query?.id || "").trim();
  if (!id) return json(res, 400, { error: "video_id_required" });
  if (!engineConfigured()) return json(res, 503, { error: "engine_not_configured" });

  try {
    const job = await getGenerationStatus(id);
    return json(res, 200, {
      ok: true,
      video_id: id,
      status: job.status || "unknown",
      video_url: job.video_url || null,
      thumbnail_url: job.thumbnail_url || null,
      duration: job.duration || null,
      error: job.error || null
    });
  } catch (error) {
    return json(res, error?.code === "engine_not_configured" ? 503 : 502, {
      error: error?.code || "engine_error",
      message: error?.message || "Hamdan's private video engine could not be reached."
    });
  }
}
