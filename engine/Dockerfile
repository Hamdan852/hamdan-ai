FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv git ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt
RUN git clone --depth 1 https://github.com/Wan-Video/Wan2.1.git

WORKDIR /opt/Wan2.1
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install -r requirements.txt

WORKDIR /app
COPY requirements.txt .
RUN python3 -m pip install -r requirements.txt
COPY server.py .

ENV WAN_ROOT=/opt/Wan2.1
ENV WAN_MODEL_DIR=/models/Wan2.1-T2V-1.3B
ENV HAMDAN_DATA_DIR=/data
ENV HAMDAN_MAX_CONCURRENCY=1

EXPOSE 8000
CMD ["uvicorn", "server:APP", "--host", "0.0.0.0", "--port", "8000"]
