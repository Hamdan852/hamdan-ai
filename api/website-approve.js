const REPOSITORY = "Hamdan852/hamdan-ai";

function json(res, status, data) {
  res.status(status).json(data);
}

function clean(value) {
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return json(res, 405, { ok: false, error: "Method not allowed" });
    }

    let body = req.body || {};
    if (typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch {
        return json(res, 400, { ok: false, error: "Invalid JSON request body." });
      }
    }

    const repository = clean(body.repository);
    const projectId = clean(body.projectId);

    if (repository !== REPOSITORY) {
      return json(res, 403, { ok: false, error: "Repository is not approved." });
    }

    if (!projectId) {
      return json(res, 400, { ok: false, error: "A project ID is required for approval." });
    }

    return json(res, 200, {
      ok: true,
      stage: "Approve",
      approved: true,
      projectId,
      repository: REPOSITORY,
      approval: {
        granted: true,
        scope: "Generate and test the approved website project",
        externalWrites: false,
        deployment: false
      },
      message: "Plan approved. Code generation and testing are now authorized; deployment remains a separate approval."
    });
  } catch (error) {
    console.error("Website approval API error", error);
    return json(res, 500, {
      ok: false,
      error: error?.message || "Website approval server error."
    });
  }
}
