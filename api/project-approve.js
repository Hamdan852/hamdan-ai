const ALLOWED_REPOSITORIES = new Set(["Hamdan852/hamdan-ai"]);
const WORKFLOW = ["Understand", "Inspect", "Plan", "Approve", "Change", "Test", "Deploy", "Verify"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const repository = typeof req.body?.repository === "string" ? req.body.repository.trim() : "";
  const plan = req.body?.plan;
  const approved = req.body?.approved === true;
  if (!repository || !ALLOWED_REPOSITORIES.has(repository)) return res.status(403).json({ error: "Repository is not approved." });
  if (!plan || plan.repository !== repository || plan.plan?.approvalRequired === false) return res.status(400).json({ error: "A valid plan is required before approval." });
  if (!approved) return res.status(200).json({ stage: "Approve", approved: false, workflow: WORKFLOW, next: "Explicit approval is required before any code-changing action." });
  return res.status(200).json({ stage: "Change", approved: true, workflow: WORKFLOW, repository, writesAuthorized: true, deploymentAuthorized: false, next: "Prepare the smallest code change described by the approved plan. Deployment remains separately controlled." });
}
