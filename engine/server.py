import os
import secrets
import subprocess
import threading
import uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, Header, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

APP = FastAPI(title="Hamdan Private Video Engine", version="0.1.0")

DATA_DIR = Path(os.getenv("HAMDAN_DATA_DIR", "/data"))
VIDEO_DIR = DATA_DIR / "videos"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

MODEL_DIR = os.getenv("WAN_MODEL_DIR", "/models/Wan2.1-T2V-1.3B")
ENGINE_TOKEN = os.getenv("HAMDAN_ENGINE_TOKEN", "")
WAN_ROOT = os.getenv("WAN_ROOT", "/opt/Wan2.1")
PYTHON_BIN = os.getenv("PYTHON_BIN", "python3")

jobs = {}
jobs_lock = threading.Lock()
executor = ThreadPoolExecutor(max_workers=int(os.getenv("HAMDAN_MAX_CONCURRENCY", "1")))


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=5000)
    mode: str = "text"
    title: str = "Hamdan AI Video"
    format: str = "16:9 Landscape"
    resolution: str = "480p"
    duration: str = "5 seconds"
    language: str = "English"
    category: str = "Custom"


def check_token(authorization: str | None):
    if ENGINE_TOKEN and authorization != f"Bearer {ENGINE_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def set_job(job_id, **values):
    with jobs_lock:
        jobs.setdefault(job_id, {}).update(values)


def run_wan(job_id: str, request: GenerateRequest):
    output = VIDEO_DIR / f"{job_id}.mp4"
    portrait = request.format == "9:16 Portrait"
    size = "480*832" if portrait else "832*480"

    command = [
        PYTHON_BIN,
        str(Path(WAN_ROOT) / "generate.py"),
        "--task", "t2v-1.3B",
        "--size", size,
        "--ckpt_dir", MODEL_DIR,
        "--offload_model", "True",
        "--t5_cpu", "True",
        "--sample_shift", "8",
        "--sample_guide_scale", "6",
        "--save_file", str(output),
        "--prompt", request.prompt,
    ]

    try:
        set_job(job_id, status="processing")
        completed = subprocess.run(
            command,
            cwd=WAN_ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=int(os.getenv("HAMDAN_JOB_TIMEOUT", "1800")),
        )
        if completed.returncode != 0 or not output.exists():
            set_job(job_id, status="failed", error="Video generation failed.", logs=completed.stdout[-4000:])
            return

        set_job(
            job_id,
            status="completed",
            video_url=f"/videos/{output.name}",
            thumbnail_url=None,
            duration=5,
        )
    except subprocess.TimeoutExpired:
        set_job(job_id, status="failed", error="Video generation timed out.")
    except Exception as exc:
        set_job(job_id, status="failed", error=str(exc))


@APP.get("/health")
def health(authorization: str | None = Header(default=None)):
    check_token(authorization)
    return {
        "ok": True,
        "service": "hamdan-private-video-engine",
        "model": "Wan2.1-T2V-1.3B",
        "model_dir_configured": Path(MODEL_DIR).exists(),
    }


@APP.post("/generate")
def generate(request: GenerateRequest, authorization: str | None = Header(default=None)):
    check_token(authorization)
    job_id = f"hamdan-{uuid.uuid4().hex}"
    with jobs_lock:
        jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "title": request.title,
        }
    executor.submit(run_wan, job_id, request)
    return {"job_id": job_id, "status": "queued"}


@APP.get("/status/{job_id}")
def status(job_id: str, authorization: str | None = Header(default=None)):
    check_token(authorization)
    with jobs_lock:
        job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


APP.mount("/videos", StaticFiles(directory=VIDEO_DIR), name="videos")
