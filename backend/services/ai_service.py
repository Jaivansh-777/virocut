"""Gemini AI service for generating clip titles, hooks, and captions."""

import os
import json
import logging

logger = logging.getLogger(__name__)

MODELS = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-pro",
]

FALLBACK_CONTENT = {
    "titles": ["\U0001f525 Viral Moment"],
    "hooks": ["Wait for it..."],
    "captions": ["This clip is ready to post."]
}


def generate_ai_content(transcript: str) -> dict:
    """
    Generate AI content using Google Gemini API.

    Returns dict with 'titles', 'hooks', 'captions' keys.
    Falls back to default content if Gemini fails.
    """
    try:
        import google.generativeai as genai

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not set, using fallback")
            return FALLBACK_CONTENT

        genai.configure(api_key=api_key)

        safe_transcript = transcript[:2000]

        prompt = (
            f"Given this video transcript: \"{safe_transcript}\"\n\n"
            "Generate engaging social media content. Return ONLY valid JSON with no markdown or code blocks:\n"
            "{\n"
            '  "titles": ["title1", "title2", "title3"],\n'
            '  "hooks": ["hook1", "hook2", "hook3"],\n'
            '  "captions": ["caption1", "caption2", "caption3"]\n'
            "}\n\n"
            "Make content viral, engaging, and optimized for Reels/TikTok/Shorts."
        )

        for model_name in MODELS:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                text = response.text.strip()

                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]

                result = json.loads(text.strip())

                if not all(k in result for k in ("titles", "hooks", "captions")):
                    raise ValueError("Missing required keys in Gemini response")

                logger.info("Used model: %s", model_name)
                return result

            except Exception as e:
                logger.warning("Model %s failed: %s", model_name, str(e))
                continue

        logger.error("All Gemini models failed, using fallback")
        return FALLBACK_CONTENT

    except ImportError:
        logger.error("google-generativeai not installed")
        return FALLBACK_CONTENT
    except Exception as e:
        logger.error("Gemini API failed: %s", str(e))
        return FALLBACK_CONTENT
