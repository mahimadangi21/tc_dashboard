import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from routes import auth, trainees, tasks, analytics, notifications

app = FastAPI(
    title="TC Trainee Tracker",
    version="1.0.0",
    description="FastAPI + NeonDB backend with async SQLAlchemy, Alembic, and JWT Authentication."
)

# CORS — wildcard origin with allow_credentials=False works for HF Spaces
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routers prefixed /api (used by the built frontend on HF Spaces) ──────
app.include_router(auth.router,                   prefix="/api")
app.include_router(trainees.router,               prefix="/api")
app.include_router(trainees.trainee_tasks_router, prefix="/api")
app.include_router(tasks.router,                  prefix="/api")
app.include_router(analytics.router,              prefix="/api")
app.include_router(notifications.router,          prefix="/api")

# Bare routes kept for local dev (no prefix)
app.include_router(auth.router)
app.include_router(trainees.router)
app.include_router(trainees.trainee_tasks_router)
app.include_router(tasks.router)
app.include_router(analytics.router)
app.include_router(notifications.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Serve built React frontend ────────────────────────────────────────────────
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))

if os.path.isdir(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Let API / docs routes fall through to their own handlers
        for prefix in ("api/", "docs", "openapi", "health", "redoc"):
            if full_path.startswith(prefix):
                from fastapi import HTTPException
                raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

else:
    @app.get("/")
    async def root():
        return {"status": "online", "message": "TC Trainee Tracker API", "docs": "/docs"}
