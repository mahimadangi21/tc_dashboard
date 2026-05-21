# ── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
# Point API at the same origin so requests go through the HF Space URL
ENV VITE_API_URL=/api
RUN npm run build


# ── Stage 2: Python backend + serve built frontend ─────────────────────────
FROM python:3.11-slim

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend into a static folder the backend will serve
COPY --from=frontend-builder /app/frontend/dist ./static/

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# HF Spaces runs as non-root user 1000
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER 1000

EXPOSE 7860

CMD ["./start.sh"]
