# ── Stage 1: Build React Frontend ─────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY decision-ui/package.json decision-ui/package-lock.json ./
RUN npm ci
COPY decision-ui/ .
RUN npm run build

# ── Stage 2: Python Backend ──────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install system deps for gunicorn + parquet
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libc6-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy backend
COPY backend/ ./backend/
COPY requirements.txt setup.py ./

# Copy built frontend into Flask's static folder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Expose Cloud Run default port
ENV PORT=8080
EXPOSE 8080

# Cloud Run requires listening on 0.0.0.0:$PORT
CMD gunicorn --bind 0.0.0.0:${PORT} --workers 2 --timeout 120 "backend.server:app"
