"""Video upload endpoint."""

import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile, File, Request

from utils.file_handler import save_upload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB


@router.options("/")
async def upload_options(request: Request):
    """Handle CORS preflight requests - just return 200."""
    return {"status": "ok"}


@router.post("/")
async def upload_video(file: UploadFile = File(...)) -> dict:
    """Accept a video file, save it with a unique name, and return metadata."""

    # --- validate extension ---
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        logger.warning("Unsupported file type: %s", ext)
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # --- validate content length (stream-based check) ---
    saved_path, saved_name, size_bytes = save_upload(file)

    if size_bytes > MAX_FILE_SIZE:
        # Clean up oversized file
        saved_path.unlink(missing_ok=True)
        logger.warning("File too large: %d bytes", size_bytes)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_bytes / 1024 / 1024:.1f} MB). Max 500 MB.",
        )

    logger.info("Saved upload: %s (%d bytes)", saved_name, size_bytes)

    return {
        "filename": saved_name,
        "size_bytes": size_bytes,
        "content_type": file.content_type,
    }
