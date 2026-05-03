import threading
from datetime import datetime

# In-memory job store (simple dict, not for multi-process)
jobs = {}
JOBS_LOCK = threading.Lock()


def update_job(job_id: str, **kwargs):
    """Thread-safe job update."""
    with JOBS_LOCK:
        if job_id in jobs:
            jobs[job_id].update(kwargs)
            jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()


def get_job(job_id: str):
    """Thread-safe job get."""
    with JOBS_LOCK:
        return jobs.get(job_id)


def create_job(job_id: str, filename: str):
    """Create a new job."""
    with JOBS_LOCK:
        jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "progress": 0,
            "filename": filename,
            "result": None,
            "error": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
