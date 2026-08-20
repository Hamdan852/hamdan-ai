function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });
  const apiKey = process.env.HEYGEN_API_KEY;
  const id = String(req.query?.id || "").trim();
  if (!apiKey) return json(res, 503, { error: "provider_not_configured" });
  if (!id) return json(res, 400, { error: "video_id_required" });

  try {
    const upstream = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(id)}`, {
      headers: { "X-Api-Key": apiKey, accept: "application/json" }
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return json(res, 502, { error: "provider_error", provider: data });
    const video = data?.data || {};
    return json(res, 200, {
      ok: true,
      video_id: id,
      status: video.status || "unknown",
      video_url: video.video_url || null,
      thumbnail_url: video.thumbnail_url || null,
      duration: video.duration || null,
      error: video.error || null
    });
  } catch (error) {
    return json(res, 502, { error: "provider_unreachable", message: error?.message || "Video provider could not be reached." });
  }
}
