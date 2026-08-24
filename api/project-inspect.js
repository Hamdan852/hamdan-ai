const ALLOWED_REPOSITORIES = new Set(["Hamdan852/hamdan-ai"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const repository = typeof req.body?.repository === "string" ? req.body.repository.trim() : "";
  const ref = typeof req.body?.ref === "string" && req.body.ref.trim() ? req.body.ref.trim() : "main";

  if (!repository) return res.status(400).json({ error: "A repository is required." });
  if (!ALLOWED_REPOSITORIES.has(repository)) {
    return res.status(403).json({ error: "Repository is not approved for inspection." });
  }

  return res.status(200).json({
    mode: "repository-inspection",
    repository,
    ref,
    status: "ready",
    scope: {
      readOnly: true,
      inspect: ["repository structure", "source files", "configuration", "API routes", "deployment configuration"],
      writes: false
    },
    workflow: ["Understand", "Inspect", "Plan", "Approve", "Change", "Test", "Deploy", "Verify"],
    message: "Inspection is authorized for the approved repository. No code changes are performed by this endpoint."
  });
}
