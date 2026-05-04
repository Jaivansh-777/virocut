"""Gemini AI service for generating clip titles, hooks, and captions."""

import os
import json
from dotenv import load_dotenv

load_dotenv()

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

        api_key = os.getenv("GEMINI_API_KEY")
        print("GEMINI_API_KEY present:", bool(api_key))

        if not api_key:
            print("WARNING: GEMINI_API_KEY not set, using fallback")
            return FALLBACK_CONTENT

        genai.configure(api_key=api_key)

        safe_transcript = transcript[:2000]
        print("Transcript sent to Gemini:", safe_transcript)

        prompt = f"""Analyze this video transcript and generate viral social media content.

Return STRICT JSON ONLY, no markdown, no explanation:

{{
  "titles": ["title1", "title2", "title3"],
  "hooks": ["hook1", "hook2", "hook3"],
  "captions": ["caption1", "caption2", "caption3"]
}}

Transcript:
{safe_transcript}"""

        for model_name in MODELS:
            try:
                print(f"Trying model: {model_name}")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)

                raw = response.text.strip()
                print(f"Raw Gemini response: {raw[:200]}")

                # Strip markdown code fences
                raw = raw.replace("```json", "").replace("```", "").strip()

                data = json.loads(raw)

                if all(k in data for k in ("titles", "hooks", "captions")):
                    print(f"Gemini success with model: {model_name}")
                    return data
                else:
                    print(f"Missing keys in response from {model_name}")

            except Exception as e:
                print(f"Model {model_name} failed: {str(e)}")
                continue

        print("ERROR: All Gemini models failed, using fallback")
        return FALLBACK_CONTENT

    except ImportError:
        print("ERROR: google-generativeai not installed")
        return FALLBACK_CONTENT
    except Exception as e:
        print(f"ERROR: Gemini API failed: {str(e)}")
        return FALLBACK_CONTENT
