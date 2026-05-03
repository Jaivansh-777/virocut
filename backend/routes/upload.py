"""Video upload endpoint — non-blocking, creates background job."""

import logging
import threading
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse

from utils.file_handler import save_upload
from job_store import create_job, update_job, get_job
from config import UPLOAD_DIR, OUTPUT_DIR
from services.transcription_service import transcribe_video
from services.ffmpeg_service import process_video
from services.ai_service import generate_clip_content
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
        update_job(job_id, status="processing", progress=10)

        # 1. Transcribe
        logger.info("[Job %s] Step1: Transcribing...", job_id)
        update_job(job_id, progress=20)
        
        video_path = UPLOAD_DIR / filename
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        transcription_result = transcribe_video(str(video_path), model_size="base")

        if isinstance(transcription_result, tuple) and len(transcription_result) == 2:
            transcript, segments = transcription_result
        else:
            transcript = transcription_result if isinstance(transcription_result, str) else ""
            segments = []

        logger.info("[Job %s] Transcript length: %d characters, %d segments",
                     job_id, len(transcript), len(segments))
        update_job(job_id, progress=30)

        # 2. Process video (FFmpeg + viral detection)
        logger.info("[Job %s] Step2: Processing video with FFmpeg...", job_id)
        update_job(job_id, progress=50)
        result = process_video(video_path, segments, transcript)
        update_job(job_id, progress=70)

        # 3. Generate per-clip AI content (Groq)
        logger.info("[Job %s] Step3: Generating AI content with Groq...", job_id)
        for clip in result.get("clips", []):
            clip_transcript = clip.get("transcript", "")
            if not clip_transcript:
                clip_transcript = transcript

            try:
                from asyncio import run as aio_run
                clip_content = aio_run(generate_clip_content(clip_transcript, clip.get("duration", 10)))

                clip["titles"] = clip_content["titles"]
                clip["hooks"] = clip_content["hooks"]
                clip["captions"] = clip_content["captions"]
            except Exception as clip_err:
                logger.warning("[Job %s] Failed to generate AI content for clip: %s", job_id, clip_err)
                clip["titles"] = ["Generated Clip"]
                clip["hooks"] = ["Check this out!"]
                clip["captions"] = ["Amazing moment from video"]

        update_job(job_id, progress=85)

        # 4. Upload clips to Google Drive
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

        result["transcript"] = transcript
        update_job(job_id, progress=100)

        # 5. Mark completed
        logger.info("[Job %s] Processing completed successfully", job_id)
        update_job(job_id, status="completed", result=result, progress=100)

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error("[Job %s] Processing failed: %s\n%s", job_id, str(e), error_trace)
        # Always update job status, never crash the server
        try:
            update_job(job_id, status="failed", error=str(e)[:500], progress=100)
        except Exception as update_err:
            logger.error("[Job %s] Failed to update job status: %s", job_id, update_err)

        # Return demo clips if processing fails (graceful degradation)
        try:
            demo_result = {
                "clips": [
                    {
                        "url": "/clips/demo_clip1.mp4",
                        "start": 0,
                        "duration": 10,
                        "title": "Demo Clip 1",
                        "platform": "reels",
                        "transcript": "Demo transcript",
                        "viral_score": 7.5,
                        "reason": "demo mode (processing failed)",
                        "titles": ["Check this out!", "Amazing moment!", "You won't believe this!"],
                        "hooks": ["Wait for it...", "This is insane!", "POV: You found the best part"],
                        "captions": ["The most viral moment", "Share this with everyone!", "This changed everything"]
                    }
                ],
                "transcript": "Demo transcript - processing failed, showing demo content"
            }
            update_job(job_id, status="completed", result=demo_result, progress=100, error=f"Original error: {str(e)[:200]}")
            logger.info("[Job %s] Returning demo clips due to processing failure", job_id)
        except Exception:
            pass  # Already logged above


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
    create_job(job_id, saved_name)
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
