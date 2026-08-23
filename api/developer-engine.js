const ENGINE_TOKEN = String(process.env.HAMDAN_DEVELOPER_ENGINE_TOKEN || "").trim();

const CAPABILITIES = [
  "project_inspection",
  "architecture_planning",
  "code_generation",
  "code_review",
  "quality_validation",
  "deployment_readiness",
  "maintenance"
];

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

function authorized(req) {
  if (!ENGINE_TOKEN) return false;
  const header = String(req.headers?.authorization || "");
  return header === `Bearer ${ENGINE_TOKEN}`;
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "method_not_allowed" });
  }

  if (!ENGINE_TOKEN) {
    return json(res, 503, {
      error: "developer_engine_not_configured",
      message: "Hamdan's internal developer engine token has not been configured."
    });
  }

  if (!authorized(req)) {
    return json(res, 401, { error: "unauthorized" });
  }

  return json(res, 200, {
    ok: true,
    service: "hamdan-developer-engine",
    role: "internal-development-control-plane",
    capabilities: CAPABILITIES,
    browser_access: false,
    repository_write_access: "server-side-only"
  });
}
