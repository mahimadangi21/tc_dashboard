import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from routes import auth, trainees, tasks, analytics, notifications

app = FastAPI(
    title="TC Trainee Tracker",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All API routes under /api prefix
app.include_router(auth.router,                    prefix="/api")
app.include_router(trainees.router,                prefix="/api")
app.include_router(trainees.trainee_tasks_router,  prefix="/api")
app.include_router(tasks.router,                   prefix="/api")
app.include_router(analytics.router,               prefix="/api")
app.include_router(notifications.router,           prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve built React frontend
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))

if os.path.isdir(STATIC_DIR):
    # Mount static assets directory
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Mount remaining static files (favicon, icons, etc.)
    @app.get("/favicon.svg")
    async def favicon():
        p = os.path.join(STATIC_DIR, "favicon.svg")
        return FileResponse(p) if os.path.isfile(p) else JSONResponse({}, status_code=404)

    # SPA fallback — must be LAST
    @app.middleware("http")
    async def spa_fallback(request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        # Only intercept 404s for non-API, non-asset paths
        if (
            response.status_code == 404
            and not path.startswith("/api/")
            and not path.startswith("/assets/")
            and not path.startswith("/health")
            and not path.startswith("/docs")
            and not path.startswith("/openapi")
        ):
            index = os.path.join(STATIC_DIR, "index.html")
            if os.path.isfile(index):
                return FileResponse(index)
        return response

else:
    @app.get("/")
    async def root():
        return {"status": "online", "message": "TC Trainee Tracker API", "docs": "/docs"}