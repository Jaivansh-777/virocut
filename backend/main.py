import logging
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from config import UPLOAD_DIR, OUTPUT_DIR
from store import jobs, JOBS_LOCK


# ---------------------------------------------------------------------------
# App and CORS
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ViroCut API",
    description="AI-powered video clipping tool that turns long videos into viral-ready shorts",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://virocut-n514.vercel.app",
        "https://virocut.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}

# Status endpoint
@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Return job status, progress, result, or error."""
    print("STATUS ENDPOINT: jobs dict id:", id(jobs))
    print("STATUS ENDPOINT: Available jobs:", list(jobs.keys()))
    
    try:
        with JOBS_LOCK:
            job = jobs.get(job_id)
        
        if not job:
            print(f"STATUS ENDPOINT: Job {job_id} not found")
            return JSONResponse(content={
                "job_id": job_id,
                "status": "failed",
                "progress": 100,
                "filename": "",
                "result": None,
                "error": "Job not found",
                "created_at": "",
                "updated_at": "",
            })
        
        print(f"STATUS ENDPOINT: Job {job_id} found, status: {job['status']}")
        return JSONResponse(content={
            "job_id": job["job_id"],
            "status": job["status"],
            "progress": job["progress"],
            "filename": job["filename"],
            "result": job["result"],
            "error": job["error"],
            "created_at": job["created_at"],
            "updated_at": job["updated_at"],
        })
    except Exception as e:
        import traceback
        print(f"Status endpoint error: {e}")
        print(traceback.format_exc())
        return JSONResponse(content={
            "job_id": job_id,
            "status": "failed",
            "progress": 100,
            "filename": "",
            "result": None,
            "error": str(e),
            "created_at": "",
            "updated_at": "",
        })

# Serve clips as static files
app.mount("/clips", StaticFiles(directory=str(OUTPUT_DIR)), name="clips")

# Register route modules
from routes import upload, process
app.include_router(upload.router)
app.include_router(process.router)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("app")


