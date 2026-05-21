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

# Configure CORS — allow localhost for dev and the HF Space origin for prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
        "https://mahimadangi-tc-dashboard.hf.space",
        "*",  # HF Spaces uses dynamic subdomains; wildcard covers all
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routers (all prefixed under /api for the HF deployment) ──────────────
app.include_router(auth.router,                  prefix="/api")
app.include_router(trainees.router,              prefix="/api")
app.include_router(trainees.trainee_tasks_router, prefix="/api")
app.include_router(tasks.router,                 prefix="/api")
app.include_router(analytics.router,             prefix="/api")
app.include_router(notifications.router,         prefix="/api")

# Keep bare (no-prefix) routes for local dev backward compatibility
app.include_router(auth.router)
app.include_router(trainees.router)
app.include_router(trainees.trainee_tasks_router)
app.include_router(tasks.router)
app.include_router(analytics.router)
app.include_router(notifications.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Serve built React frontend (production / HF Spaces) ──────────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

if os.path.isdir(STATIC_DIR):
    # Mount assets (JS/CSS chunks) at /assets
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    # Catch-all: return index.html for any unknown path so React Router works
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API or docs routes
        if full_path.startswith(("api/", "docs", "openapi", "health")):
            from fastapi import HTTPException
            raise HTTPException(status_code=404)
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

else:
    @app.get("/")
    async def root():
        return {
            "status": "online",
            "message": "Welcome to the TC Trainee Tracker API!",
            "documentation_url": "/docs"
        }
