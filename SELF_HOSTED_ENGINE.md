# Hamdan AI — private video engine

Hamdan's web application is designed so video generation does not depend on HeyGen or another hosted avatar/video API.

## Architecture

```text
Browser
  ↓
Vercel /api/generate
  ↓
Hamdan private video engine (HAMDAN_ENGINE_URL)
  ↓
Self-hosted open video model + GPU
  ↓
MP4 + job status
  ↓
Vercel /api/status
  ↓
Hamdan dashboard
```

The Vercel application owns the product workflow, validation, credits, projects and UI. The GPU engine is a separate service that we control and can replace without changing the Hamdan frontend.

## Engine contract

### POST `/generate`

Request:

```json
{
  "prompt": "A cinematic sunrise over the mountains of Pakistan",
  "mode": "text",
  "format": "16:9 Landscape",
  "resolution": "480p",
  "duration": "5 seconds",
  "language": "English",
  "category": "Cinematic",
  "title": "Hamdan AI Video"
}
```

Response:

```json
{
  "job_id": "hamdan-job-123",
  "status": "queued"
}
```

### GET `/status/:job_id`

Queued/processing response:

```json
{
  "job_id": "hamdan-job-123",
  "status": "processing"
}
```

Completed response:

```json
{
  "job_id": "hamdan-job-123",
  "status": "completed",
  "video_url": "https://your-hamdan-storage.example/videos/hamdan-job-123.mp4",
  "thumbnail_url": null,
  "duration": 5
}
```

Failed response:

```json
{
  "job_id": "hamdan-job-123",
  "status": "failed",
  "error": "Generation failed"
}
```

## Vercel environment variables

Set these only after the private engine is deployed:

- `HAMDAN_ENGINE_URL` — private HTTPS base URL of the Hamdan engine.
- `HAMDAN_ENGINE_TOKEN` — optional shared secret used by the web app to authenticate with the engine.

The browser never receives either value.

## First self-hosted model target

For the first production engine, use an open-weight Wan-family model hosted on hardware we control. A smaller Wan2.1 T2V-1.3B target is appropriate for the first proof of concept because its published inference requirements are substantially lower than the larger models. Start with short 480p generations, then scale quality/resolution as GPU capacity allows.

The web application must remain model-agnostic: the model can later be upgraded without changing the public Hamdan API.

## Important reality

A genuinely independent AI video service still needs compute. Vercel is suitable for the web/control layer, but it is not the place to run a large GPU video model. For true ownership, the generation model must run on hardware we control (for example, a dedicated GPU server). Until that engine is connected, Hamdan should report `engine_not_configured` rather than pretending a video was generated.
