from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import OUTPUT_DIR

# Create output dir for serving clips
OUTPUT_DIR.mkdir(exist_ok=True)

app = FastAPI(title="ViroCut API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for now - restrict in production
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
    from store import jobs
    
    print(f"STATUS: Checking job {job_id}")
    print(f"STATUS: Available jobs: {list(jobs.keys())}")
    
    if job_id not in jobs:
        return {
            "job_id": job_id,
            "status": "failed",
            "progress": 100,
            "filename": "",
            "result": None,
            "error": "Job not found",
            "created_at": "",
            "updated_at": ""
        }
    
    return jobs[job_id]

# Serve clips
app.mount("/clips", StaticFiles(directory=str(OUTPUT_DIR)), name="clips")

# Include upload routes
from routes import upload
app.include_router(upload.router)

print("ViroCut API started!")
