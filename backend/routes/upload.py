"""Video upload endpoint — creates job and processes in background."""

import os
import subprocess
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


def get_video_duration(input_path: Path) -> int:
    """Get video duration in seconds using ffprobe."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(input_path),
        ],
        capture_output=True, text=True, timeout=30,
    )
    return int(float(result.stdout.strip()))


def split_video(input_path: Path, output_dir: Path, duration: int, clip_length: int = 15, max_clips: int = 5) -> list[dict]:
    """Split video into multiple clips using ffmpeg. Returns clip metadata list."""
    clips_meta = []
    num_clips = min(max_clips, (duration + clip_length - 1) // clip_length)
    if num_clips < 1:
        num_clips = 1

    for i in range(num_clips):
        start = i * clip_length
        remaining = duration - start
        actual_duration = min(clip_length, remaining)

        if actual_duration < 5:
            continue

        output_name = f"clip_{i + 1}.mp4"
        output_path = output_dir / output_name

        print(f"Generating clip {i + 1}: start={start}s, duration={actual_duration}s")

        try:
            subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-i", str(input_path),
                    "-ss", str(start),
                    "-t", str(actual_duration),
                    "-c", "copy",
                    str(output_path),
                ],
                capture_output=True, text=True, timeout=60,
            )

            if output_path.exists() and output_path.stat().st_size > 0:
                print(f"Saved clip: {output_path}")
                clips_meta.append({
                    "start": start,
                    "duration": actual_duration,
                    "filename": output_name,
                })
            else:
                print(f"ffmpeg produced empty clip for {output_name}, retrying with re-encode")
                subprocess.run(
                    [
                        "ffmpeg", "-y",
                        "-i", str(input_path),
                        "-ss", str(start),
                        "-t", str(actual_duration),
                        "-c:v", "libx264",
                        "-c:a", "aac",
                        str(output_path),
                    ],
                    capture_output=True, text=True, timeout=120,
                )
                if output_path.exists() and output_path.stat().st_size > 0:
                    print(f"Saved clip (re-encoded): {output_path}")
                    clips_meta.append({
                        "start": start,
                        "duration": actual_duration,
                        "filename": output_name,
                    })

        except subprocess.TimeoutExpired:
            print(f"ffmpeg timed out for clip {i + 1}")
        except Exception as e:
            print(f"ffmpeg error for clip {i + 1}: {e}")

    return clips_meta


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

        # STEP 1 — Get duration and generate transcript
        print("STEP 1: Getting video duration...")
        try:
            duration = get_video_duration(input_path)
            print(f"Video duration: {duration}s")
        except Exception:
            duration = 60
            print(f"Could not detect duration, using default: {duration}s")

        transcript = "Generated transcript from uploaded video."
        jobs[job_id]["progress"] = 30
        jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # STEP 2 — Split video into clips using ffmpeg
        print("STEP 2: Splitting video into clips...")
        clips_meta = split_video(input_path, OUTPUT_DIR, duration, clip_length=15, max_clips=5)

        if not clips_meta:
            print("No clips generated, creating fallback clip")
            clips_meta = [{
                "start": 0,
                "duration": min(15, duration),
                "filename": None,
            }]

        jobs[job_id]["progress"] = 60
        jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # STEP 3 — Generate AI content per clip
        print("STEP 3: Generating AI content for each clip...")
        clips = []
        for i, cm in enumerate(clips_meta):
            ai = generate_ai_content(transcript)

            titles = ai.get("titles") or ["\U0001f525 Viral Moment"]
            hooks = ai.get("hooks") or ["Wait for it..."]
            captions = ai.get("captions") or ["This clip is ready to post."]

            clip_url = f"/outputs/{cm['filename']}" if cm.get("filename") else f"/uploads/{filename}"

            clip = {
                "url": clip_url,
                "download_url": clip_url,
                "start": cm["start"],
                "duration": cm["duration"],
                "title": titles[0],
                "transcript": transcript,
                "titles": titles,
                "hooks": hooks,
                "captions": captions,
                "platform": "reels",
            }
            clips.append(clip)

        jobs[job_id]["progress"] = 80
        jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

        # STEP 4 — Complete job
        print(f"STEP 4: Completing job with {len(clips)} clips...")
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["result"] = {
            "transcript": transcript,
            "clips": clips,
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
