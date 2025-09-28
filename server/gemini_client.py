import os
import json
import requests

# Read either GEMINI_API_KEY or GOOGLE_API_KEY
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# Default to a free/fast model; must include the "models/" prefix for REST
MODEL = os.getenv("XANDRIAAI_GEMINI_MODEL", "models/gemini-2.0-flash").strip()

ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/{MODEL}:generateContent"

def _fallback(language: str) -> str:
    if (language or "").lower() in {"javascript", "typescript"}:
        return "// (fallback) Suggested snippet for javascript\nfunction hello(){ return 'world'; }\n"
    return "// (fallback) Suggested snippet for python\ndef hello():\n    return 'world'\n"

def _strip_code_fences(text: str) -> str:
    text = (text or "").strip()
    if text.startswith("```"):
        lines = text.splitlines()[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return text

def suggest_snippet_with_gemini(language: str, code_context: str) -> str:
    # No key? Fallback so demos never break.
    if not API_KEY:
        return _fallback(language)

    # Trim input to conserve free-tier tokens
    code_context = (code_context or "")
    if len(code_context) > 4000:
        code_context = code_context[:4000]

    prompt = (
        "You are XandriaAI. Suggest a concise, high-quality code snippet that improves or extends the user's context. "
        "Return ONLY the code (no commentary).\n"
        f"Language: {language}\n\n"
        "User code/context:\n"
        "------------------\n"
        f"{code_context}\n"
        "------------------\n"
    )

    body = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    try:
        resp = requests.post(
            ENDPOINT,
            params={"key": API_KEY},
            headers={"Content-Type": "application/json"},
            data=json.dumps(body),
            timeout=15,
        )
        # Handle quota/rate-limit or other errors by returning fallback instead of 500
        if resp.status_code == 429:
            return _fallback(language)
        resp.raise_for_status()

        data = resp.json()
        # The text lives at candidates[0].content.parts[0].text
        candidates = (data or {}).get("candidates") or []
        if not candidates:
            return _fallback(language)
        parts = (candidates[0].get("content") or {}).get("parts") or []
        text = parts[0].get("text") if parts else ""
        text = _strip_code_fences(text)
        return text or _fallback(language)

    except requests.RequestException:
        # Network/HTTP issues → fallback
        return _fallback(language)
