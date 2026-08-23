# Hamdan private video engine

This service is the first self-hosted generation engine for Hamdan AI. It wraps the open-weight Wan2.1 T2V-1.3B model and exposes the small API contract used by the Vercel application.

## Why this exists

Hamdan's web application no longer requires HeyGen for its video-generation path. The generation model runs in infrastructure controlled by Hamdan instead of being tied to a commercial avatar API.

## Hardware target

Wan2.1 documents the T2V-1.3B model as the smaller text-to-video option and reports roughly 8.19 GB VRAM for the model. The first engine target is short 480p clips; longer videos can later be built by chaining multiple generated shots and stitching them server-side.

## Model files

Download the Wan2.1 T2V-1.3B checkpoint into the directory configured by `WAN_MODEL_DIR` (default `/models/Wan2.1-T2V-1.3B`). Do not commit model weights to GitHub.

## Environment

- `WAN_MODEL_DIR` — local checkpoint directory.
- `HAMDAN_ENGINE_TOKEN` — shared secret used by the Vercel control layer.
- `HAMDAN_ENGINE_PUBLIC_URL` — public HTTPS base URL used when returning completed video URLs.
- `HAMDAN_DATA_DIR` — persistent directory for generated MP4 files.
- `HAMDAN_MAX_CONCURRENCY` — number of generation jobs; start at `1`.

## Endpoints

- `GET /health`
- `POST /generate`
- `GET /status/{job_id}`
- `GET /videos/{filename}`

## First release scope

The first self-hosted engine supports Text → Video. The Hamdan web layer is already structured around the same engine contract for Script and Avatar workflows, but those workflows should only be enabled when the engine implementation for them is actually ready.

## Security

Put the engine behind HTTPS and a firewall. Keep `HAMDAN_ENGINE_TOKEN` private. Do not expose the model directory or management ports to the public internet.
