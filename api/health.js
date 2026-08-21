function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

export default function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });

  return json(res, 200, {
    ok: true,
    service: "hamdan-ai",
    environment: process.env.VERCEL_ENV || "unknown",
    provider_configured: Boolean(process.env.HEYGEN_API_KEY),
    timestamp: new Date().toISOString()
  });
}
