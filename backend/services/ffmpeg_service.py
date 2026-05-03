"""FFmpeg service — handles video analysis and clip extraction.

Uses Whisper segments to find viral moments and extract clips.
"""

import asyncio
import logging
import os
import re
import subprocess
from pathlib import Path
from uuid import uuid4
from config import OUTPUT_DIR

logger = logging.getLogger(__name__)

# Viral keywords for scoring
EMOTION_WORDS = [
    "wow", "omg", "oh my god", "no way", "crazy", "insane",
    "shocked", "scared", "funny", "hilarious", "amazing", "unbelievable"
]

HUMOR_WORDS = [
    "laugh", "lol", "haha", "hah", "what", "wait", "bro", "dude",
    "bruh", "ayo", "wtf", "omg", "no way"
]

ACTION_WORDS = [
    "fight", "steal", "shave", "jump", "fall", "break", "reveal",
    "surprise", "challenge", "win", "lose", "crash", "explode"
]

# Clip settings
CLIP_MIN_DURATION = 8.0
CLIP_MAX_DURATION = 15.0
CLIP_TARGET_DURATION = 10.0
NUM_CLIPS = 3


def _calculate_viral_score(text: str, start: float, end: float) -> tuple[float, list[str]]:
    """Calculate viral score for a text segment.

    Returns: (score, list of reasons)
    """
    text_lower = text.lower()
    score = 0.0
    reasons = []

    # Check for emotion words
    for word in EMOTION_WORDS:
        if word in text_lower:
            score += 2.0
            reasons.append(f"emotion:'{word}'")

    # Check for humor words
    for word in HUMOR_WORDS:
        if word in text_lower:
            score += 1.5
            reasons.append(f"humor:'{word}'")

    # Check for action words
    for word in ACTION_WORDS:
        if word in text_lower:
            score += 2.5
            reasons.append(f"action:'{word}'")

    # Check for named entities (capitalized words, possible names)
    names = re.findall(r'\b[A-Z][a-z]+\b', text)
    if names:
        score += len(names) * 1.0
        reasons.append(f"names:{','.join(names[:3])}")

    # Exclamation marks (excitement)
    exclamations = text.count('!')
    if exclamations > 0:
        score += exclamations * 0.5
        reasons.append(f"exclamations:{exclamations}")

    # Short, punchy dialogue (high information density)
    words = text.split()
    if len(words) > 5 and len(words) < 30:
        score += 1.0
        reasons.append("punchy dialogue")

    # Repeated reactions (like "what what what")
    word_counts = {}
    for word in words:
        word_clean = word.lower().strip('.,!?')
        word_counts[word_clean] = word_counts.get(word_clean, 0) + 1
    for word, count in word_counts.items():
        if count > 2 and len(word) > 2:
            score += count * 0.5
            reasons.append(f"repeated:'{word}'")

    return score, reasons


def _chunk_segments(segments: list, min_duration: float = CLIP_MIN_DURATION,
                     max_duration: float = CLIP_MAX_DURATION) -> list:
    """Combine Whisper segments into chunks of suitable clip duration.

    Returns list of dicts with 'start', 'end', 'text', 'score' keys.
    """
    if not segments:
        return []

    chunks = []
    current_chunk = {
        'start': segments[0].get('start', 0),
        'end': segments[0].get('end', 0),
        'text': segments[0].get('text', '').strip(),
        'segments': [segments[0]]
    }

    for seg in segments[1:]:
        seg_start = seg.get('start', 0)
        seg_end = seg.get('end', 0)
        seg_text = seg.get('text', '').strip()

        # If adding this segment would exceed max duration, finalize current chunk
        if seg_end - current_chunk['start'] > max_duration:
            # Calculate duration and score
            duration = current_chunk['end'] - current_chunk['start']
            if duration >= min_duration:
                score, reasons = _calculate_viral_score(
                    current_chunk['text'],
                    current_chunk['start'],
                    current_chunk['end']
                )
                current_chunk['score'] = score
                current_chunk['reasons'] = reasons
                chunks.append(current_chunk)

            # Start new chunk
            current_chunk = {
                'start': seg_start,
                'end': seg_end,
                'text': seg_text,
                'segments': [seg]
            }
        else:
            # Add to current chunk
            current_chunk['end'] = seg_end
            current_chunk['text'] += ' ' + seg_text
            current_chunk['segments'].append(seg)

    # Don't forget the last chunk
    duration = current_chunk['end'] - current_chunk['start']
    if duration >= min_duration:
        score, reasons = _calculate_viral_score(
            current_chunk['text'],
            current_chunk['start'],
            current_chunk['end']
        )
        current_chunk['score'] = score
        current_chunk['reasons'] = reasons
        chunks.append(current_chunk)

    return chunks


def _select_top_clips(chunks: list, num_clips: int = NUM_CLIPS) -> list:
    """Select top N non-overlapping clips based on viral score."""
    # Sort by score descending
    sorted_chunks = sorted(chunks, key=lambda x: x['score'], reverse=True)

    selected = []
    for chunk in sorted_chunks:
        # Check if this chunk overlaps with any already selected clip
        overlap = False
        for selected_chunk in selected:
            # Check for overlap
            if (chunk['start'] <= selected_chunk['end'] and
                chunk['end'] >= selected_chunk['start']):
                overlap = True
                break

        if not overlap:
            selected.append(chunk)

        if len(selected) >= num_clips:
            break

    # If we don't have enough clips, add highest scoring remaining chunks
    if len(selected) < num_clips:
        for chunk in sorted_chunks:
            if chunk not in selected:
                selected.append(chunk)
            if len(selected) >= num_clips:
                break

    return selected


async def get_video_duration(file_path: Path) -> float:
    """Get video duration in seconds using ffprobe."""
    try:
        logger.info("Getting duration for: %s", file_path.name)
        proc = await asyncio.create_subprocess_exec(
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(file_path),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            error_msg = stderr.decode()
            logger.error("ffprobe failed (code %d): %s", proc.returncode, error_msg)
            return 0.0

        duration = float(stdout.decode().strip())
        if duration <= 0:
            logger.error("Invalid duration: %.2f", duration)
            return 0.0

        logger.info("Video duration: %.2f seconds", duration)
        return duration
    except Exception as e:
        logger.error("Failed to get video duration: %s", str(e))
        return 0.0


async def extract_clip(file_path: Path, start: float, duration: float, output_path: Path) -> bool:
    """Extract a clip from video using ffmpeg."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg",
            "-i", str(file_path),
            "-ss", str(start),
            "-t", str(duration),
            "-c", "copy",
            "-y",
            str(output_path),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        await proc.communicate()

        if proc.returncode == 0 and output_path.exists():
            logger.info("Clip extracted: %s (start=%.1f, duration=%.1f)", output_path.name, start, duration)
            return True
        else:
            logger.error("ffmpeg failed to extract clip")
            return False
    except Exception as e:
        logger.error("Failed to extract clip: %s", e)
        return False


async def process_video(file_path: Path, segments: list = None, transcript: str = "") -> dict:
    """Process video and extract clips from viral moments.

    Args:
        file_path: Path to video file
        segments: Whisper segments with start, end, text keys
        transcript: Full video transcript (for fallback clip content)

    Returns dict with 'clips' containing clip info.
    """
    logger.info("="*50)
    logger.info("PROCESSING VIDEO: %s", file_path)
    logger.info("="*50)

    # Get video duration
    duration = await get_video_duration(file_path)
    if duration == 0.0:
        logger.warning("Could not determine video duration")
        return {"clips": []}

    # If no segments provided, return empty
    if not segments:
        logger.warning("No segments provided")
        return {"clips": []}

    logger.info("Video duration: %.2f seconds", duration)
    logger.info("Number of segments: %d", len(segments))

    # Handle short videos (duration <= 30s or few segments)
    if duration <= 30 or len(segments) <= 2:
        logger.info("Short video detected, generating single clip")
        short_clip = {
            'start': 0,
            'end': min(duration, CLIP_TARGET_DURATION),
            'text': transcript[:500] if transcript else "Short video clip",
            'score': 7.0,
            'reasons': ['Short video processed as one clip']
        }
        top_chunks = [short_clip]
        logger.info("Short video: will generate 1 clip from start=0, duration=%.1f", short_clip['end'])
    else:
        # Chunk segments into clips
        logger.info("Chunking %d segments into clips...", len(segments))
        chunks = _chunk_segments(segments)

        if not chunks:
            logger.warning("No suitable chunks found")
            # Fallback: generate one clip from start
            fallback_chunk = {
                'start': 0,
                'end': min(duration, CLIP_TARGET_DURATION),
                'text': transcript[:500] if transcript else "Fallback clip",
                'score': 5.0,
                'reasons': ['Fallback: no chunks found']
            }
            top_chunks = [fallback_chunk]
            logger.info("Using fallback clip: start=0, duration=%.1f", fallback_chunk['end'])
        else:
            logger.info("Found %d chunks, selecting top %d", len(chunks), NUM_CLIPS)
            top_chunks = _select_top_clips(chunks, NUM_CLIPS)

    # Select top clips based on viral score
    top_chunks = _select_top_clips(chunks, NUM_CLIPS)

    logger.info("Selected %d top chunks for clip generation", len(top_chunks))
    for i, chunk in enumerate(top_chunks):
        logger.info("  Chunk %d: start=%.1f, end=%.1f, score=%.2f, reason=%s",
                   i+1, chunk['start'], chunk['end'], chunk['score'], chunk.get('reason', 'N/A'))

    # If no viral clips found, fallback to safe timestamps
    if not top_chunks:
        logger.warning("No viral chunks found, using fallback timestamps")
        top_chunks = [
            {'start': 0, 'end': CLIP_TARGET_DURATION, 'text': transcript[:200] if transcript else "clip 1", 'score': 0, 'reasons': ['fallback']},
            {'start': min(10, duration/3), 'end': min(10+CLIP_TARGET_DURATION, duration), 'text': transcript[200:400] if transcript else "clip 2", 'score': 0, 'reasons': ['fallback']},
            {'start': min(20, duration*2/3), 'end': min(20+CLIP_TARGET_DURATION, duration), 'text': transcript[400:600] if transcript else "clip 3", 'score': 0, 'reasons': ['fallback']},
        ]

    # Extract clips
    clips = []
    for i, chunk in enumerate(top_chunks, 1):
        start = chunk['start']
        clip_duration = min(CLIP_TARGET_DURATION, chunk['end'] - chunk['start'])
        clip_filename = f"clip_{uuid4().hex[:8]}.mp4"
        output_path = OUTPUT_DIR / clip_filename

        logger.info("Extracting clip %d: start=%.1f, duration=%.1f", i, start, clip_duration)

        success = await extract_clip(file_path, start, clip_duration, output_path)

        if success:
            clip_data = {
                "url": f"http://localhost:8000/clips/{clip_filename}",
                "start": round(start, 2),
                "duration": round(clip_duration, 2),
                "title": f"Clip {i}",
                "platform": "reels",
                "transcript": chunk.get('text', ''),
                "viral_score": round(chunk.get('score', 0), 2),
                "reason": "; ".join(chunk.get('reasons', [])) if chunk.get('reasons') else "high information density"
            }
            clips.append(clip_data)
            logger.info("Clip %d: url=%s, score=%.2f", i, clip_data['url'], chunk.get('score', 0))
        else:
            logger.warning("Failed to extract clip %d, skipping", i)

    if not clips:
        logger.error("No clips generated at all")
        return {"clips": []}

    logger.info("Generated %d clips", len(clips))
    return {"clips": clips}
