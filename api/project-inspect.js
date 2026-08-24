const ALLOWED_REPOSITORIES = new Set(["Hamdan852/hamdan-ai"]);
const WORKFLOW = ["Understand", "Inspect", "Plan", "Approve", "Change", "Test", "Deploy", "Verify"];
const MAX_FILES = 300;

function githubHeaders() {
  const headers = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function githubJson(url) {
  const response = await fetch(url, { headers: githubHeaders() });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message || `GitHub request failed with ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

function classifyFiles(files) {
  const names = files.map(file => file.path.toLowerCase());
  const has = (value) => names.some(name => name === value || name.endsWith(`/${value}`));
  const apiCount = names.filter(name => name.startsWith("api/")).length;
  const checks = [];
  checks.push({ area: "Repository structure", status: files.length ? "found" : "empty", detail: `${files.length} tracked files inspected` });
  checks.push({ area: "API routes", status: apiCount ? "found" : "missing", detail: apiCount ? `${apiCount} API file(s) under api/` : "No api/ files found" });
  checks.push({ area: "Vercel configuration", status: has("vercel.json") ? "found" : "missing", detail: has("vercel.json") ? "vercel.json is present" : "No vercel.json found" });
  checks.push({ area: "Documentation", status: has("readme.md") ? "found" : "missing", detail: has("readme.md") ? "README.md is present" : "No README.md found" });
  checks.push({ area: "Package manifest", status: has("package.json") ? "found" : "missing", detail: has("package.json") ? "package.json is present" : "No package.json found" });
  return checks;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const repository = typeof req.body?.repository === "string" ? req.body.repository.trim() : "";
  const ref = typeof req.body?.ref === "string" && req.body.ref.trim() ? req.body.ref.trim() : "main";
  if (!repository) return res.status(400).json({ error: "A repository is required." });
  if (!ALLOWED_REPOSITORIES.has(repository)) return res.status(403).json({ error: "Repository is not approved for inspection." });

  try {
    const [owner, name] = repository.split("/");
    const tree = await githubJson(`https://api.github.com/repos/${owner}/${name}/git/trees/${encodeURIComponent(ref)}?recursive=1`);
    const files = (tree.tree || []).filter(item => item.type === "blob").slice(0, MAX_FILES).map(item => ({ path: item.path, sha: item.sha, size: item.size || 0 }));
    const truncated = (tree.tree || []).filter(item => item.type === "blob").length > MAX_FILES;
    const checks = classifyFiles(files);

    return res.status(200).json({
      mode: "repository-inspection",
      repository,
      ref,
      status: "inspected",
      scope: { readOnly: true, writes: false, maxFiles: MAX_FILES },
      workflow: WORKFLOW,
      stage: "Inspect",
      summary: { fileCount: files.length, truncated, checks },
      files,
      next: "Use the inspection evidence to create a Plan. No code changes or deployments are performed by this endpoint."
    });
  } catch (error) {
    return res.status(error.status === 404 ? 404 : 502).json({ error: "Repository inspection failed.", detail: error.message });
  }
}
