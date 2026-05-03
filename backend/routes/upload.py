"""Video upload endpoint — non-blocking, creates background job."""

import logging
import threading
import uuid
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse

from utils.file_handler import save_upload
from store import jobs, JOBS_LOCK
from config import UPLOAD_DIR, OUTPUT_DIR
from services.transcription_service import transcribe_video
from services.ffmpeg_service import process_video
try:
    from services.ai_service import generate_clip_content
except ImportError:
    generate_clip_content = None
    import logging
    logging.getLogger(__name__).warning("AI service not available, using fallback")
from services.drive_service import upload_clip_to_drive

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB (keep small for Render free tier)


def _background_processing(job_id: str, filename: str):
    """Run video processing in background thread.

    Steps:
    1. Transcribe with Whisper
    2. Detect viral moments & generate clips (FFmpeg)
    3. Generate per-clip AI content (Groq)
    4. Upload clips to Google Drive
    5. Update job status & store result
    """
    try:
        import traceback
        print(f"STEP 1: Starting processing for job {job_id}")
        print(f"STEP 1: Video file: {filename}")
        
        with JOBS_LOCK:
            if job_id in jobs:
                jobs[job_id]["status"] = "processing"
                jobs[job_id]["progress"] = 10
                jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # 1. Transcribe
        print(f"STEP 1: Transcribing video...")
        logger.info("[Job %s] Step1: Transcribing...", job_id)
        
        video_path = UPLOAD_DIR / filename
        print(f"STEP 1: Video path: {video_path}")
        print(f"STEP 1: File exists: {video_path.exists()}")
        
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        transcription_result = transcribe_video(str(video_path), model_size="base")
        print(f"STEP 1: Transcription result type: {type(transcription_result)}")

        if isinstance(transcription_result, tuple) and len(transcription_result) == 2:
            transcript, segments = transcription_result
        else:
            transcript = transcription_result if isinstance(transcription_result, str) else ""
            segments = []

        print(f"STEP 1: Transcript length: {len(transcript)} characters")
        print(f"STEP 1: Number of segments: {len(segments)}")
        logger.info("[Job %s] Transcript length: %d characters, %d segments",
                     job_id, len(transcript), len(segments))
        
        with JOBS_LOCK:
            if job_id in jobs:
                jobs[job_id]["progress"] = 30
                jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # 2. Process video (FFmpeg + viral detection)
        print(f"STEP 2: Processing video with FFmpeg...")
        logger.info("[Job %s] Step2: Processing video with FFmpeg...", job_id)
        
        with JOBS_LOCK:
            if job_id in jobs:
                jobs[job_id]["progress"] = 50
                jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()
        
        # process_video is async, need to run it properly
        import asyncio
        result = asyncio.run(process_video(video_path, segments, transcript))
        print(f"STEP 2: Result keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}")
        print(f"STEP 2: Number of clips: {len(result.get('clips', []))}")
        
        with JOBS_LOCK:
            if job_id in jobs:
                jobs[job_id]["progress"] = 70
                jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # 3. Generate per-clip AI content (Groq)
        print(f"STEP 3: Generating AI content...")
        logger.info("[Job %s] Step3: Generating AI content with Groq...", job_id)
        
        for i, clip in enumerate(result.get("clips", [])):
            print(f"STEP 3: Processing clip {i+1}")
            clip_transcript = clip.get("transcript", "")
            if not clip_transcript:
                clip_transcript = transcript

            try:
                if generate_clip_content is not None:
                    print(f"STEP 3: Calling Groq API for clip {i+1}...")
                    from asyncio import run as aio_run
                    clip_content = aio_run(generate_clip_content(clip_transcript, clip.get("duration", 10)))

                    clip["titles"] = clip_content["titles"]
                    clip["hooks"] = clip_content["hooks"]
                    clip["captions"] = clip_content["captions"]
                    print(f"STEP 3: Clip {i+1} AI content generated successfully")
                else:
                    print(f"STEP 3: AI service not available, using fallback for clip {i+1}")
                    raise ImportError("AI service not available")
            except Exception as clip_err:
                logger.warning("[Job %s] Failed to generate AI content for clip: %s", job_id, clip_err)
                clip["titles"] = ["Generated Clip"]
                clip["hooks"] = ["Check this out!"]
                clip["captions"] = ["Amazing moment from video"]

        with JOBS_LOCK:
            if job_id in jobs:
                jobs[job_id]["progress"] = 85
                jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # 4. Upload clips to Google Drive
        print(f"STEP 4: Uploading clips to Drive...")
        logger.info("[Job %s] Step4: Uploading clips to Drive...", job_id)

        for clip in result.get("clips", []):
            local_url = clip.get("url", "")
            if local_url and "localhost" in local_url:
                clip_filename = local_url.split("/")[-1]
                local_path = OUTPUT_DIR / clip_filename

                if local_path.exists():
                    try:
                        drive_result = upload_clip_to_drive(str(local_path), clip_filename)
                        if drive_result and drive_result.get("url"):
                            clip["url"] = drive_result["url"]
                            clip["view_url"] = drive_result.get("view_url", "")
                            clip["file_id"] = drive_result.get("file_id", "")
                            local_path.unlink(missing_ok=True)
                            logger.info("[Job %s] Clip uploaded to Drive: %s", job_id, clip_filename)
                    except Exception as drive_err:
                        logger.warning("[Job %s] Drive upload failed: %s", job_id, drive_err)

        # Delete original uploaded video
        try:
            video_path.unlink(missing_ok=True)
            logger.info("[Job %s] Original video deleted: %s", job_id, filename)
        except Exception as e:
            logger.warning("[Job %s] Failed to delete original video: %s", job_id, e)

        # Ensure we have at least one clip
        if not result.get("clips"):
            print(f"WARNING: No clips generated, creating fallback clip")
            result["clips"] = [{
                "url": f"file://{video_path}",
                "start": 0,
                "duration": 30,
                "title": "Generated Clip",
                "platform": "reels",
                "transcript": transcript[:500] if transcript else "No transcript",
                "viral_score": 5.0,
                "reason": "fallback - no clips generated",
                "titles": ["Check this out!", "Amazing moment!", "You won't believe this!"],
                "hooks": ["Wait for it...", "This is insane!", "POV: You found the best part"],
                "captions": ["The most viral moment", "Share this with everyone!", "This changed everything"]
            }]

        result["transcript"] = transcript
        print(f"DONE: Processing complete for job {job_id}")
        print(f"DONE: Transcript length: {len(transcript)}")
        print(f"DONE: Number of clips: {len(result.get('clips', []))}")
        
        with JOBS_LOCK:
            if job_id in jobs:
                jobs[job_id]["progress"] = 100
                jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # 5. Mark completed
        logger.info("[Job %s] Processing completed successfully", job_id)
        with JOBS_LOCK:
            if job_id in jobs:
                jobs[job_id]["status"] = "completed"
                jobs[job_id]["result"] = result
                jobs[job_id]["progress"] = 100
                jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error("[Job %s] Processing failed: %s\n%s", job_id, str(e), error_trace)
        # Always update job status, never crash the server
        try:
            with JOBS_LOCK:
                if job_id in jobs:
                    jobs[job_id]["status"] = "failed"
                    jobs[job_id]["error"] = str(e)[:500]
                    jobs[job_id]["progress"] = 100
                    jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()
        except Exception as update_err:
            logger.error("[Job %s] Failed to update job status: %s", job_id, update_err)


@router.options("/")
async def upload_options(request: Request):
    """Handle CORS preflight requests."""
    return {"status": "ok"}


@router.post("/")
async def upload_video(file: UploadFile = File(...)) -> JSONResponse:
    """Accept a video file, save it, create a background job, and return job_id immediately."""

    # 1. Validate extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        logger.warning("Unsupported file type: %s", ext)
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # 2. Save file (this is quick)
    try:
        saved_path, saved_name, size_bytes = save_upload(file)
    except Exception as e:
        logger.error("Failed to save upload: %s", e)
        raise HTTPException(status_code=500, detail="Failed to save file")

    # 3. Validate file size
    if size_bytes > MAX_FILE_SIZE:
        saved_path.unlink(missing_ok=True)
        logger.warning("File too large: %d bytes", size_bytes)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_bytes / 1024 / 1024:.1f} MB). Max 50 MB.",
        )

    # 4. Validate file size (already checked but double-check)
    if size_bytes > MAX_FILE_SIZE:
        saved_path.unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail=f"File too large. Max 50 MB.")

    # 5. Create job
    job_id = str(uuid.uuid4())
    print(f"UPLOAD: Creating job {job_id} for {saved_name}")
    with JOBS_LOCK:
        jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "progress": 0,
            "filename": saved_name,
            "result": None,
            "error": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
    print(f"UPLOAD: jobs dict id: {id(jobs)}")
    print(f"UPLOAD: Available jobs: {list(jobs.keys())}")
    logger.info("Created job %s for file %s (%d bytes)", job_id, saved_name, size_bytes)

    # 6. Start background processing (non-blocking)
    thread = threading.Thread(
        target=_background_processing,
        args=(job_id, saved_name),
        daemon=True,
    )
    thread.start()

    # 7. Return immediately
    return JSONResponse(content={
        "job_id": job_id,
        "status": "queued",
        "filename": saved_name,
        "size_bytes": size_bytes,
    })
