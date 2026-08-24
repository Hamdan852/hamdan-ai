export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) return res.status(400).json({ error: "A developer question is required." });

  const text = prompt.toLowerCase();
  let title = "Initial engineering assessment";
  let summary = "Hamdan Developer has classified the request and will follow its controlled engineering workflow.";
  let action = "Inspect project structure, configuration, relevant files and deployment state.";
  let risk = "Low — planning only";
  let areas = ["Project context", "Architecture", "Verification"];
  let stage = "Inspect";
  let nextStages = ["Plan", "Approve", "Change", "Test", "Verify"];

  if (text.includes("sign in") || text.includes("login") || text.includes("authentication")) {
    title = "Authentication investigation";
    summary = "Determine whether the problem is in the UI, session handling, server authentication or deployment configuration. Production authentication should not rely on browser-only credentials.";
    action = "Inspect the authentication UI, session flow, server endpoints, environment configuration and deployment state before changing the system.";
    risk = "High — authentication changes require controlled approval";
    areas = ["Auth flow", "Sessions", "Security"];
    stage = "Inspect";
  } else if (text.includes("mobile") || text.includes("responsive")) {
    title = "Responsive design assessment";
    summary = "Inspect the existing layout and breakpoints first, then make targeted responsive changes instead of redesigning the whole interface.";
    action = "Inspect viewport behavior, sidebar/header rules, overflow and touch targets; then test common phone widths.";
    risk = "Low — UI changes can be tested before release";
    areas = ["Responsive CSS", "Navigation", "Accessibility"];
    stage = "Inspect";
  } else if (text.includes("deploy") || text.includes("vercel") || text.includes("build")) {
    title = "Deployment investigation";
    summary = "Deployment problems should be diagnosed from the actual build and runtime state rather than guessed from the frontend.";
    action = "Inspect deployment metadata, build logs, environment variables, routes and runtime errors; identify the first actionable failure.";
    risk = "Medium — deployment changes can affect production";
    areas = ["Build", "Environment", "Runtime"];
    stage = "Inspect";
  } else if (text.includes("gpu") || text.includes("ai infrastructure") || text.includes("video generation")) {
    title = "AI infrastructure assessment";
    summary = "Separate the public web application from compute workers so future GPU infrastructure can be added without redesigning Hamdan.";
    action = "Define a job queue, worker API, model adapter layer, storage flow, resource monitoring and fallback strategy.";
    risk = "Medium — infrastructure design should precede hardware purchases";
    areas = ["GPU worker", "Job queue", "Model adapters"];
    stage = "Plan";
  } else if (text.includes("security") || text.includes("hack") || text.includes("secure")) {
    title = "Security assessment";
    summary = "Security should be treated as an architecture concern, not just a collection of frontend protections.";
    action = "Inspect authentication, authorization, secrets, API routes, file handling, dependencies, logging and deployment configuration.";
    risk = "High — security changes need careful verification";
    areas = ["Secrets", "Authorization", "Attack surface"];
    stage = "Inspect";
  }

  return res.status(200).json({
    title,
    summary,
    action,
    risk,
    areas,
    stage,
    workflow: ["Understand", "Inspect", "Plan", "Approve", "Change", "Test", "Deploy", "Verify"],
    nextStages,
    mode: "deterministic-workflow"
  });
}
