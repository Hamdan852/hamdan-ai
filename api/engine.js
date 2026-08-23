const ENGINE_URL = String(process.env.HAMDAN_ENGINE_URL || "").trim().replace(/\/$/, "");
const ENGINE_TOKEN = String(process.env.HAMDAN_ENGINE_TOKEN || "").trim();

function authHeaders() {
  const headers = { accept: "application/json" };
  if (ENGINE_TOKEN) headers.authorization = `Bearer ${ENGINE_TOKEN}`;
  return headers;
}

export function engineConfigured() {
  return Boolean(ENGINE_URL);
}

export async function startGeneration(payload) {
  if (!ENGINE_URL) {
    const error = new Error("Hamdan's private video engine is not connected yet.");
    error.code = "engine_not_configured";
    throw error;
  }

  const response = await fetch(`${ENGINE_URL}/generate`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.job_id) {
    const error = new Error(data?.message || data?.error || `Hamdan engine rejected the request (${response.status}).`);
    error.code = "engine_error";
    error.status = response.status;
    error.provider = data;
    throw error;
  }

  return data;
}

export async function getGenerationStatus(jobId) {
  if (!ENGINE_URL) {
    const error = new Error("Hamdan's private video engine is not connected yet.");
    error.code = "engine_not_configured";
    throw error;
  }

  const response = await fetch(`${ENGINE_URL}/status/${encodeURIComponent(jobId)}`, {
    headers: authHeaders(),
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Hamdan engine status failed (${response.status}).`);
    error.code = "engine_error";
    error.status = response.status;
    error.provider = data;
    throw error;
  }

  return data;
}
