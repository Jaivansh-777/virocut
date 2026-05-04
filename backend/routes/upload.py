"""Video upload endpoint — creates job and processes in background."""

import threading
import uuid
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from config import UPLOAD_DIR, OUTPUT_DIR
from store import jobs
from services.ai_service import generate_ai_content

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}

FALLBACK_AI = {
    "titles": ["\U0001f525 Viral Moment"],
    "hooks": ["Wait for it..."],
    "captions": ["This clip is ready to post."]
}


def process_video(job_id: str, filename: str):
    """Process video in background thread — never crash the server."""
    try:
        print(f"START: job_id={job_id}, filename={filename}")

        jobs[job_id]["status"] = "processing"
        jobs[job_id]["progress"] = 10
        jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        input_path = UPLOAD_DIR / filename
        if not input_path.exists():
            raise FileNotFoundError(f"File not found: {input_path}")

        # STEP 1 — Generate fallback transcript (no whisper/torch)
        print("STEP 1: Generating transcript...")
        transcript = "Generated transcript from uploaded video."
        jobs[job_id]["progress"] = 30
        jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # STEP 2 — Call Gemini for titles, hooks, captions
        print("STEP 2: Calling Gemini API...")
        ai = generate_ai_content(transcript)
        print(f"STEP 2: Got AI content: {list(ai.keys())}")
        jobs[job_id]["progress"] = 60
        jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # STEP 3 — Create clip with AI content attached
        print("STEP 3: Creating clip with AI content...")
        clip_url = f"/uploads/{filename}"
        clip = {
            "url": clip_url,
            "download_url": clip_url,
            "start": 0,
            "duration": 10,
            "title": ai["titles"][0] if ai["titles"] else "Viral Clip",
            "titles": ai["titles"],
            "hooks": ai["hooks"],
            "captions": ai["captions"],
            "platform": "reels",
        }
        jobs[job_id]["progress"] = 80
        jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # STEP 4 — Complete job
        print("STEP 4: Completing job...")
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["result"] = {
            "transcript": transcript,
            "clips": [clip],
        }
        jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()
        print(f"DONE: job_id={job_id}")

    except Exception as e:
        import traceback
        print(f"ERROR in process_video: {traceback.format_exc()}")

        jobs[job_id]["status"] = "failed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["error"] = str(e)
        jobs[job_id]["result"] = None
        jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()


@router.post("/")
async def upload_video(file: UploadFile = File(...)) -> JSONResponse:
    """Accept video, save it, create job, start background processing."""

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    try:
        file_content = await file.read()
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / filename
        file_path.write_bytes(file_content)
        size_bytes = len(file_content)
        print(f"UPLOAD: Saved {filename} ({size_bytes} bytes)")
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to save file") from exc

    job_id = str(uuid.uuid4())
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
    print(f"UPLOAD: Created job {job_id}")

    thread = threading.Thread(target=process_video, args=(job_id, filename), daemon=True)
    thread.start()

    return JSONResponse(content={
        "job_id": job_id,
        "status": "queued",
        "filename": filename,
        "size_bytes": size_bytes,
    })
