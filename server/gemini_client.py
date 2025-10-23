import os
import json
import requests
from dotenv import load_dotenv

# ---------------------------
# ✅ Ensure .env loads correctly even when FastAPI reloads
# ---------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH, override=True)
    print(f"[Gemini Client] ✅ .env loaded from {ENV_PATH}")
else:
    print(f"[Gemini Client] ⚠️ .env not found at {ENV_PATH}")

# ---------------------------
# ✅ Read Gemini API key and model info
# ---------------------------
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
MODEL = os.getenv("XANDRIAAI_GEMINI_MODEL", "models/gemini-2.0-flash").strip()
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/{MODEL}:generateContent"

if API_KEY:
    print("[Gemini Client] 🔑 API key loaded successfully.")
else:
    print("[Gemini Client] ❌ Missing API key – will fallback if used.")

# ---------------------------
# ✅ Helpers
# ---------------------------
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

# ---------------------------
# ✅ Main snippet generation
# ---------------------------
def suggest_snippet_with_gemini(language: str, code_context: str) -> str:
    if not API_KEY:
        print("[Gemini] ⚠️ Missing API key – returning fallback.")
        return _fallback(language)

    code_context = (code_context or "")
    if len(code_context) > 4000:
        code_context = code_context[:4000]

    body = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            "You are XandriaAI, a helpful code assistant. "
                            "Generate a short, clean, and working code snippet "
                            f"for this {language} context:\n\n{code_context}\n\n"
                            "Return only code, no commentary."
                        )
                    }
                ],
            }
        ]
    }

    try:
        resp = requests.post(
            ENDPOINT,
            params={"key": API_KEY},
            headers={"Content-Type": "application/json"},
            data=json.dumps(body),
            timeout=20,
        )

        print(f"[Gemini] HTTP {resp.status_code} for {ENDPOINT}")
        if resp.status_code != 200:
            print(f"[Gemini] Response text: {resp.text}")
            return _fallback(language)

        data = resp.json()
        candidates = (data or {}).get("candidates") or []
        if not candidates:
            print("[Gemini] No candidates found – using fallback.")
            return _fallback(language)

        parts = (candidates[0].get("content") or {}).get("parts") or []
        text = parts[0].get("text") if parts else ""
        text = _strip_code_fences(text)
        return text or _fallback(language)

    except requests.RequestException as e:
        print(f"[Gemini] Network or HTTP error: {e}")
        return _fallback(language)
