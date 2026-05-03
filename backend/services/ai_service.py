"""Groq AI service — generates captions, hooks, and titles using Groq API."""

import asyncio
import json
import logging
import os

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
API_KEY = os.environ.get("GROQ_API_KEY", "")
if not API_KEY:
    logger.warning("GROQ_API_KEY not set in environment or .env file")

# Optional import - service will use fallbacks if not available
try:
    from groq import Groq
    client = Groq(api_key=API_KEY) if API_KEY else None
except ImportError:
    Groq = None
    client = None
    logger.warning("groq module not installed. AI features will use fallback mode.")

MODEL_NAME = "llama-3.1-8b-instant"

# Timeout for Groq calls (seconds)
GROQ_TIMEOUT = 30


def _call_groq(prompt: str) -> str | None:
    """Call Groq API and return response text or None on failure."""
    if client is None:
        logger.warning("Groq client not available, using fallback")
        return None
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,
            timeout=GROQ_TIMEOUT,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Groq failed:", e)
        logger.error("GROQ FAILED: %s", e)
        return None


def _parse_json(raw: str):
    """Parse JSON from Groq response, handling markdown wrappers."""
    if raw.startswith("```"):
        raw = raw.strip("```").strip()
        if raw.startswith("json"):
            raw = raw[4:].strip()
    return json.loads(raw)


def _is_generic(content: str) -> bool:
    """Check if generated content is too generic/motivational."""
    generic_phrases = [
        "99% of people",
        "this one tip",
        "changed everything",
        "stop scrolling",
        "you need to hear this",
        "this changed my life",
        "nobody talks about this",
        "the one thing holding you back",
        "secret strategy",
        "how to master this in 30 days",
    ]
    content_lower = content.lower()
    return any(phrase in content_lower for phrase in generic_phrases)


# ---------------------------------------------------------------------------
# Smart fallback functions (based on transcript keywords)
# ---------------------------------------------------------------------------
def fallback_captions(transcript: str) -> list[str]:
    """Generate captions based on transcript keywords."""
    text = transcript.lower()
    captions = []

    if "island" in text:
        captions.append("$1 vs $250M private island 😳")
        captions.append("This island tour got insane 🏝️")
    if "monkey" in text:
        captions.append("Monkeys literally stealing everything 🐒💀")
    if "water slide" in text or "slide" in text:
        captions.append("This water slide is insane 😱")
    if "million" in text or "rich" in text:
        captions.append("When you realize how much this costs 💰")
    if "boat" in text or "yacht" in text:
        captions.append("POV: You're on a $100M yacht ⛵")
    if "mansion" in text or "house" in text:
        captions.append("Wait until you see the master bedroom 🏠")

    # Ensure we always return at least 3
    if len(captions) < 3:
        captions.append("You won't believe what happens next 🔥")
        captions.append("This video is absolutely wild 🤯")
        captions.append("I can't believe this is real 😱")

    return captions[:3]


def fallback_hooks(transcript: str) -> list[str]:
    """Generate hooks based on transcript keywords."""
    text = transcript.lower()

    if "island" in text:
        return [
            "From $1 to $250M island… wait till the end",
            "This private island gets crazier every second",
            "You won't believe what's on the final island",
            "This is not a normal island video",
            "Things got out of control on this island",
        ]
    if "monkey" in text:
        return [
            "POV: Monkeys are stealing your stuff 🐒",
            "This monkey theft is getting out of hand",
            "You won't believe what this monkey did",
            "Monkeys just ruined everything 😱",
            "Wait until you see the monkey finale",
        ]
    if "million" in text or "rich" in text:
        return [
            "How to spend $100 million in 24 hours",
            "This is what extreme wealth looks like",
            "You've never seen this much money before",
            "The most expensive day of my life",
            "Rich people have it different...",
        ]

    # Default hooks
    return [
        "Wait until you see the ending",
        "This is absolutely insane",
        "You won't believe what happens next",
        "I can't believe this is real",
        "This changed everything for me",
    ]


def fallback_titles(transcript: str) -> list[str]:
    """Generate titles based on transcript keywords."""
    text = transcript.lower()

    if "island" in text:
        return [
            "$1 vs $250 Million Private Island",
            "Inside the Craziest Private Islands",
            "This Island Has Everything",
        ]
    if "monkey" in text:
        return [
            "Monkeys Stole Everything 😱",
            "POV: Monkeys Are Taking Over",
            "The Great Monkey Heist",
        ]
    if "million" in text or "rich" in text:
        return [
            "How I Spent $100 Million in One Day",
            "Inside the Life of the Ultra-Rich",
            "This Is What Extreme Wealth Looks Like",
        ]

    return [
        "You Won't Believe What Happened",
        "This Video Is Absolutely Wild",
        "Wait Until You See The Ending",
    ]


# ---------------------------------------------------------------------------
# Core functions
# ---------------------------------------------------------------------------
async def generate_captions(transcript: str) -> list[str]:
    """Generate 3 viral-style Instagram captions from transcript."""
    prompt = f"""You are a viral content creator.

Based on this transcript:
{transcript}

Generate exactly 3 viral captions that are:
- Specific to the actual content in the video
- Short, emotional, and platform-ready
- Include relevant emoji
- NOT generic motivational advice

Return ONLY a valid JSON array of 3 strings. Nothing else.
Example: ["caption 1", "caption 2", "caption 3"]"""

    # Try Groq first
    raw = _call_groq(prompt)

    if raw:
        try:
            captions = _parse_json(raw)
            if isinstance(captions, list) and len(captions) == 3:
                all_captions = " ".join(captions)
                if not _is_generic(all_captions):
                    logger.info("GROQ SUCCESS: Generated 3 captions")
                    return [str(c) for c in captions]
                logger.warning("Captions too generic, using fallback")
        except Exception as e:
            logger.error("Failed to parse Groq captions: %s", e)

    # Fallback to transcript-based captions
    print("USING SMART FALLBACK for captions")
    logger.warning("USING SMART FALLBACK for captions")
    return fallback_captions(transcript)


async def generate_hooks(transcript: str) -> list[str]:
    """Generate 5 attention-grabbing hooks from transcript."""
    prompt = f"""You are a viral content creator.

Based on this transcript:
{transcript}

Generate exactly 5 scroll-stopping hooks that are:
- Specific to the actual content in the video
- Catchy and attention-grabbing
- NOT generic motivational phrases
- Suitable for TikTok, Reels, or Shorts

Return ONLY a valid JSON array of 5 strings. Nothing else.
Example: ["hook 1", "hook 2", "hook 3", "hook 4", "hook 5"]"""

    # Try Groq first
    raw = _call_groq(prompt)

    if raw:
        try:
            hooks = _parse_json(raw)
            if isinstance(hooks, list) and len(hooks) >= 5:
                all_hooks = " ".join(hooks[:5])
                if not _is_generic(all_hooks):
                    logger.info("GROQ SUCCESS: Generated 5 hooks")
                    return [str(h) for h in hooks[:5]]
                logger.warning("Hooks too generic, using fallback")
        except Exception as e:
            logger.error("Failed to parse Groq hooks: %s", e)

    # Fallback to transcript-based hooks
    print("USING SMART FALLBACK for hooks")
    logger.warning("USING SMART FALLBACK for hooks")
    return fallback_hooks(transcript)


async def generate_titles(transcript: str) -> list[str]:
    """Generate 3 engaging video titles from transcript."""
    prompt = f"""You are a viral content creator.

Based on this transcript:
{transcript}

Generate exactly 3 YouTube-style titles that are:
- Specific to the actual content in the video
- Click-worthy and engaging
- NOT generic motivational advice
- Suitable for YouTube Shorts, TikTok, or Instagram Reels
- Max 60 characters each

Return ONLY a valid JSON array of 3 strings. Nothing else.
Example: ["title 1", "title 2", "title 3"]"""

    # Try Groq first
    raw = _call_groq(prompt)

    if raw:
        try:
            titles = _parse_json(raw)
            if isinstance(titles, list) and len(titles) >= 3:
                all_titles = " ".join(titles[:3])
                if not _is_generic(all_titles):
                    logger.info("GROQ SUCCESS: Generated 3 titles")
                    return [str(t)[:60] for t in titles[:3]]
                logger.warning("Titles too generic, using fallback")
        except Exception as e:
            logger.error("Failed to parse Groq titles: %s", e)

    # Fallback to transcript-based titles
    print("USING SMART FALLBACK for titles")
    logger.warning("USING SMART FALLBACK for titles")
    return fallback_titles(transcript)


async def generate_clip_content(clip_transcript: str, duration: float) -> dict:
    """Generate titles, hooks, and caption for a single clip.

    Returns dict with 'titles', 'hooks', 'captions' keys.
    """
    prompt = f"""You are a YouTube Shorts SEO expert.

Based ONLY on this clip transcript:
{clip_transcript}

Clip Duration: {duration}s
Platform: YouTube Shorts / Reels

Generate:
- 2 viral titles (max 60 characters each)
- 2 hooks (attention-grabbing)
- 1 caption (short with emoji)

Rules:
- Must mention actual content (names/actions)
- Max 60 characters per title
- No generic phrases like "you won't believe" or "this is insane"
- Make it engaging, funny, or shocking

Return ONLY a valid JSON object:
{{
  "titles": ["title1", "title2"],
  "hooks": ["hook1", "hook2"],
  "captions": ["caption1"]
}}"""

    raw = _call_groq(prompt)

    if raw:
        try:
            # Parse JSON (handle possible markdown wrappers)
            if raw.startswith("```"):
                raw = raw.strip("```").strip()
                if raw.startswith("json"):
                    raw = raw[4:].strip()
            data = json.loads(raw)

            if isinstance(data, dict):
                titles = data.get("titles", [])
                hooks = data.get("hooks", [])
                captions = data.get("captions", [])

                # Validate and clean
                titles = [str(t)[:60] for t in titles if t][:2]
                hooks = [str(h) for h in hooks if h][:2]
                captions = [str(c) for c in captions if c][:1]

                # Check if too generic
                all_text = " ".join(titles + hooks + captions)
                if not _is_generic(all_text) and titles and hooks and captions:
                    logger.info("GROQ SUCCESS: Generated clip content")
                    return {
                        "titles": titles,
                        "hooks": hooks,
                        "captions": captions
                    }
                logger.warning("Clip content too generic, using fallback")
        except Exception as e:
            logger.error("Failed to parse clip content: %s", e)

    # Fallback based on transcript keywords
    print("USING SMART FALLBACK for clip content")
    logger.warning("USING SMART FALLBACK for clip content")
    text = clip_transcript.lower()

    if "island" in text:
        return {
            "titles": ["$1 vs $250M Private Island", "Inside Craziest Islands"],
            "hooks": ["Wait until you see this island", "This island tour is insane"],
            "captions": ["$1 vs $250M private island 😳"]
        }
    if "monkey" in text:
        return {
            "titles": ["Monkeys Stole Everything 😱", "POV: Monkeys Taking Over"],
            "hooks": ["You won't believe this monkey", "Monkeys are stealing everything"],
            "captions": ["Monkeys literally stealing everything 🐒💀"]
        }

    return {
        "titles": ["You Won't Believe What Happened", "This Video Is Wild"],
        "hooks": ["Wait until you see this", "This is absolutely insane"],
        "captions": ["You won't believe what happens next 🔥"]
    }
