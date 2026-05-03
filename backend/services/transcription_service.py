"""Whisper transcription service — transcribes video audio to text."""

import logging
import os
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

# Fallback transcript if Whisper fails
_FALLBACK_TRANSCRIPT = "This is a motivational fitness video about discipline and consistency"


def get_clip_transcript(segments: list, clip_start: float, clip_end: float) -> str:
    """Extract transcript text for a clip based on timestamps.

    Args:
        segments: List of Whisper segments with 'start', 'end', 'text' keys
        clip_start: Start time of clip in seconds
        clip_end: End time of clip in seconds

    Returns:
        Concatenated transcript text for the clip
    """
    clip_texts = []
    for seg in segments:
        seg_start = seg.get("start", 0)
        seg_end = seg.get("end", 0)

        # Check if segment overlaps with clip
        if seg_end >= clip_start and seg_start <= clip_end:
            text = seg.get("text", "").strip()
            if text:
                clip_texts.append(text)

    return " ".join(clip_texts)


def transcribe_video(input_path: str, model_size: str = "base") -> tuple[str, list]:
    """Transcribe video file using Whisper.

    Extracts audio using FFmpeg first, then transcribes with Whisper.

    Args:
        input_path: Path to the video file
        model_size: Whisper model size (tiny, base, small, medium, large)

    Returns:
        Tuple of (transcript_text, segments_list) or fallback on failure.
        Segments are dicts with 'start', 'end', 'text' keys.
    """
    try:
        import whisper
    except ImportError:
        logger.error("openai-whisper not installed. Using fallback transcript.")
        return _FALLBACK_TRANSCRIPT, []

    try:
        # Use absolute path
        input_path = os.path.abspath(input_path)
        logger.info("Loading Whisper model: %s", model_size)
        model = whisper.load_model(model_size)

        # Extract audio to WAV format (16kHz, mono) for better Whisper compatibility
        audio_path = input_path + ".wav"

        logger.info("Extracting audio from: %s", input_path)
        try:
            proc = subprocess.run(
                [
                    "ffmpeg", "-i", input_path,
                    "-vn",                  # no video
                    "-acodec", "pcm_s16le",  # PCM 16-bit
                    "-ar", "16000",           # 16kHz sample rate
                    "-ac", "1",               # mono
                    "-y",                     # overwrite output
                    audio_path
                ],
                capture_output=True,
                text=True,
                timeout=60
            )

            if proc.returncode != 0:
                logger.error("FFmpeg audio extraction failed: %s", proc.stderr)
                # Fall back to using video file directly
                audio_path = input_path
            else:
                logger.info("Audio extracted successfully: %s", audio_path)
        except Exception as ffmpeg_err:
            logger.error("FFmpeg failed: %s", ffmpeg_err)
            # Fall back to using video file directly
            audio_path = input_path

        # Transcribe using extracted audio (or video file as fallback)
        logger.info("Transcribing: %s", audio_path)
        result = model.transcribe(audio_path, fp16=False)

        transcript = result.get("text", "").strip()
        segments = result.get("segments", [])

        # Clean up temporary audio file if we created one
        if audio_path != input_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except:
                pass

        # If transcript is empty, use fallback
        if not transcript:
            print("WARNING: Empty transcript, using fallback")
            logger.warning("Empty transcript, using fallback")
            return _FALLBACK_TRANSCRIPT, []

        # Log the transcript for debugging
        print("TRANSCRIPT:", transcript[:200], "..." if len(transcript) > 200 else "")
        logger.info("Transcription complete: %d characters, %d segments", len(transcript), len(segments))

        return transcript, segments

    except Exception as e:
        print("WHISPER FAILED:", str(e))
        logger.error("Whisper transcription failed: %s", e)
        return _FALLBACK_TRANSCRIPT, []
