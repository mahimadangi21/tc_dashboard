# Stage 1: Build React frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build


# Stage 2: Python backend
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./static/
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER 1000

EXPOSE 7860
CMD ["./start.sh"]