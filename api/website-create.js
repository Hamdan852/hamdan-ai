const ALLOWED_REPOSITORIES = new Set(["Hamdan852/hamdan-ai"]);
function clean(value, max = 12000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const repository = clean(req.body?.repository, 200), name = clean(req.body?.name, 120), brief = clean(req.body?.brief, 12000), type = clean(req.body?.type, 80) || "Custom";
  if (!ALLOWED_REPOSITORIES.has(repository)) return res.status(403).json({ error: "Repository is not approved." });
  if (!name || !brief) return res.status(400).json({ error: "Website name and brief are required." });
  const projectId = `site_${Date.now().toString(36)}`;
  const files = [{ path: "index.html", purpose: "Website entry page" }, { path: "styles.css", purpose: "Responsive visual system" }, { path: "app.js", purpose: "Interactive behavior" }, { path: "README.md", purpose: "Project instructions and requirements" }];
  return res.status(200).json({ ok: true, stage: "Plan", project: { id: projectId, name, type, brief, repository, status: "Planned", approved: false }, files, workflow: ["Understand", "Inspect", "Plan", "Approve", "Change", "Test", "Deploy", "Verify"], approvalRequired: true, approved: false, writesPerformed: false, deploymentPerformed: false, message: "Website project plan created. Explicit approval is required before files are generated." });
}
