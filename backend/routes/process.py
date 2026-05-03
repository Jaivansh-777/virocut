"""Video processing endpoint — kept for backwards compatibility.

   NOTE: New uploads use background jobs via /upload.
   This router is now optional; results are primarily served via /status/{job_id}.
"""

import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from config import UPLOAD_DIR, OUTPUT_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/process", tags=["process"])

# In-memory store for old-style results (fallback)
_old_results = {}


def register_result(filename: str, result: dict):
    """Store result for old-style /process flow."""
    _old_results[filename] = result


@router.options("/")
async def process_options(request):
    """Handle CORS preflight requests."""
    return {"status": "ok"}


@router.get("/result/{filename}")
async def get_result(filename: str):
    """Get processing result by filename (old flow)."""
    if filename not in _old_results:
        raise HTTPException(status_code=404, detail="Result not found")
    return JSONResponse(content=_old_results[filename])
