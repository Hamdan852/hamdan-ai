const ALLOWED_REPOSITORIES = new Set(["Hamdan852/hamdan-ai"]);
const WORKFLOW = ["Understand", "Inspect", "Plan", "Approve", "Change", "Test", "Deploy", "Verify"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const repository = typeof req.body?.repository === "string" ? req.body.repository.trim() : "";
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const inspection = req.body?.inspection;

  if (!repository || !ALLOWED_REPOSITORIES.has(repository)) return res.status(403).json({ error: "Repository is not approved for planning." });
  if (!prompt) return res.status(400).json({ error: "A planning request is required." });
  if (!inspection || inspection.repository !== repository || inspection.readOnly !== true) {
    return res.status(400).json({ error: "A valid read-only inspection result is required before planning." });
  }

  const checks = Array.isArray(inspection.checks) ? inspection.checks : Array.isArray(inspection.summary?.checks) ? inspection.summary.checks : [];
  const files = Array.isArray(inspection.files) ? inspection.files : [];
  const missing = checks.filter(item => item.status === "missing").map(item => item.area);
  const found = checks.filter(item => item.status === "found").map(item => item.area);
  const text = prompt.toLowerCase();
  const priorities = [];

  if (text.includes("security") || text.includes("secure") || text.includes("hack")) priorities.push({ priority: "P0", area: "Security", reason: "Security requests require evidence from auth, secrets, API routes and deployment configuration before implementation." });
  if (text.includes("deploy") || text.includes("vercel") || text.includes("build")) priorities.push({ priority: "P0", area: "Deployment", reason: "Build and deployment configuration should be verified before production changes." });
  if (text.includes("mobile") || text.includes("responsive")) priorities.push({ priority: "P1", area: "Responsive UI", reason: "Inspect existing layout and breakpoints before making targeted UI changes." });
  if (text.includes("video") || text.includes("ai")) priorities.push({ priority: "P1", area: "AI/video architecture", reason: "Keep generation behind a provider/job boundary so the frontend remains independent of compute infrastructure." });
  if (!priorities.length) priorities.push({ priority: "P1", area: "Project architecture", reason: "Start with the inspected structure and make the smallest safe change that addresses the request." });

  return res.status(200).json({
    mode: "evidence-based-plan",
    repository,
    stage: "Plan",
    workflow: WORKFLOW,
    request: prompt,
    evidence: {
      inspectedFiles: files.length,
      foundAreas: found,
      missingAreas: missing,
      truncated: Boolean(inspection.summary?.truncated)
    },
    plan: {
      objective: "Address the requested outcome using the inspected repository state.",
      priorities,
      proposedSequence: ["Confirm scope", "Review affected files", "Prepare minimal code change", "Run verification", "Request approval before merge or production deployment"],
      approvalRequired: true,
      writesPerformed: false,
      deploymentPerformed: false
    },
    next: "Approval is required before any code-changing stage."
  });
}
