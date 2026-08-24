const ALLOWED_REPOSITORIES = new Set(["Hamdan852/hamdan-ai"]);
const WORKFLOW = ["Understand", "Inspect", "Plan", "Approve", "Change", "Test", "Deploy", "Verify"];

function clean(value, max = 200) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const repository = clean(req.body?.repository);
  const projectId = clean(req.body?.projectId);
  const approved = req.body?.approved === true;
  const target = clean(req.body?.target) || "vercel";
  if (!ALLOWED_REPOSITORIES.has(repository)) return res.status(403).json({ error: "Repository is not approved." });
  if (!projectId) return res.status(400).json({ error: "Project ID is required." });
  if (!approved) return res.status(403).json({ error: "Explicit deployment approval is required." });
  if (target !== "vercel") return res.status(400).json({ error: "Unsupported deployment target." });

  return res.status(200).json({
    ok: true,
    stage: "Deploy",
    workflow: WORKFLOW,
    projectId,
    target: "Vercel",
    deployment: {
      status: "ready",
      provider: "Vercel",
      action: "handoff-required",
      liveUrl: null,
      message: "Deployment authorization is accepted. A server-side Vercel connector must execute the deployment; no browser-side secret is used."
    },
    verifyAfterDeploy: true
  });
}
