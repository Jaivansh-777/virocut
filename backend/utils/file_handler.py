"""File handling utilities."""

import uuid
from pathlib import Path

from fastapi import UploadFile
from config import UPLOAD_DIR


def save_upload(file: UploadFile) -> tuple[Path, str, int]:
    """Stream an uploaded file to disk under a UUID-based name.

    Returns ``(saved_path, saved_filename, total_bytes)``.
    """

    ext = Path(file.filename or "").suffix.lower() or ".mp4"
    saved_name = f"{uuid.uuid4().hex}{ext}"
    saved_path = UPLOAD_DIR / saved_name

    total = 0
    with open(saved_path, "wb") as dest:
        while True:
            chunk = file.file.read(1024 * 1024)  # 1 MB chunks
            if not chunk:
                break
            total += len(chunk)
            dest.write(chunk)

    return saved_path, saved_name, total
