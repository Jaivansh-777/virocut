"""Video processing endpoint — integrates Whisper transcription and Gemini AI for clip-specific content."""

import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from services.ffmpeg_service import process_video
from services.transcription_service import transcribe_video, get_clip_transcript
from services.ai_service import generate_clip_content
from services.drive_service import upload_clip_to_drive
from utils.file_handler import UPLOAD_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/process", tags=["process"])


class ProcessRequest(BaseModel):
    filename: str


@router.options("/")
async def process_options(request: Request):
    """Handle CORS preflight requests - just return 200."""
    return {"status": "ok"}


@router.post("/")
async def process(req: ProcessRequest) -> dict:
    """Run video processing pipeline and return clips with per-clip AI-generated content."""

    filename = req.filename.strip()

    # --- validate filename safety (prevent path traversal) ---
    if not filename or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    # --- check file exists ---
    file_path = UPLOAD_DIR / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")

    logger.info("Processing: %s", filename)

    # Transcribe video using Whisper (returns transcript + segments with timestamps)
    transcription_result = transcribe_video(str(file_path), model_size="base")
    # Handle tuple return (transcript, segments)
    if isinstance(transcription_result, tuple) and len(transcription_result) == 2:
        transcript, segments = transcription_result
    else:
        # Fallback case
        transcript = transcription_result if isinstance(transcription_result, str) else ""
        segments = []

    logger.info("Transcript length: %d characters, %d segments", len(transcript), len(segments))
    print("FINAL TRANSCRIPT:", transcript[:300], "..." if len(transcript) > 300 else "")

    # Run video processing pipeline (FFmpeg-based clipping using viral moment detection)
    result = await process_video(file_path, segments, transcript)

    # Generate per-clip content and upload to Drive
    for clip in result["clips"]:
        clip_transcript = clip.get("transcript", "")
        clip_duration = clip.get("duration", 10)
        local_url = clip.get("url", "")

        if not clip_transcript:
            clip_transcript = transcript  # Fallback to full transcript

        print(f"CLIP {clip.get('start', 0)}s TRANSCRIPT:", clip_transcript[:200])

        # Generate titles, hooks, caption for this clip
        clip_content = await generate_clip_content(clip_transcript, clip_duration)

        # Attach AI-generated content to clip object
        clip["titles"] = clip_content["titles"]
        clip["hooks"] = clip_content["hooks"]
        clip["captions"] = clip_content["captions"]

        # Upload clip to Google Drive
        if local_url.startswith("http://localhost"):
            # Extract local file path from URL
            clip_filename = local_url.split("/")[-1]
            local_path = Path("clips") / clip_filename
            logger.info("DRIVE UPLOAD START: %s", clip_filename)

            drive_result = upload_clip_to_drive(str(local_path), clip_filename)

            if drive_result and drive_result.get("url"):
                # Replace local URL with Drive URL
                clip["url"] = drive_result["url"]
                clip["view_url"] = drive_result.get("view_url", "")
                clip["file_id"] = drive_result.get("file_id", "")

                # Delete local file after successful upload
                try:
                    local_path.unlink(missing_ok=True)
                    logger.info("LOCAL FILE DELETED: %s", local_path)
                except Exception as e:
                    logger.warning("Failed to delete local file: %s", e)
            else:
                logger.warning("Drive upload failed, keeping local URL")
                # In development, keep local URL; in production, this should be an error

    # Delete original uploaded video after processing
    try:
        file_path.unlink(missing_ok=True)
        logger.info("ORIGINAL VIDEO DELETED: %s", filename)
    except Exception as e:
        logger.warning("Failed to delete original video: %s", e)

    # Attach full transcript to result
    result["transcript"] = transcript

    # Log final clip URLs
    for i, clip in enumerate(result["clips"]):
        print(f"FINAL CLIP URL {i+1}: {clip.get('url', 'NO URL')}")
        logger.info("Clip %d: url=%s, score=%.2f", i+1, clip.get('url', ''), clip.get('viral_score', 0))

    logger.info(
        "Processing complete: %s clips with per-clip content generated",
        len(result["clips"]),
    )

    return result
