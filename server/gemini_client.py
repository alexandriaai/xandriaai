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
MODEL = os.getenv("XANDRIAAI_GEMINI_MODEL", "gemini-2.5-flash")  # no "models/" prefix

# Automatically choose the correct API version based on the model family
if MODEL.startswith("gemini-2"):
    API_VERSION = "v1"
else:
    API_VERSION = "v1beta"

ENDPOINT = f"https://generativelanguage.googleapis.com/{API_VERSION}/models/{MODEL}:generateContent"
print(f"[Gemini Client] Using endpoint: {ENDPOINT}")

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
            print(f"[Gemini] ❌ Response text: {resp.text}")
            return f"// Gemini error {resp.status_code}: {resp.text}"

        data = resp.json()
        print("[Gemini] Raw preview:", json.dumps(data, indent=2)[:200], "...")

        try:
            text = (
                data["candidates"][0]["content"]["parts"][0].get("text")
                or data["candidates"][0].get("output", "")
            )
        except Exception as parse_error:
            print("[Gemini] ⚠️ Parse error:", parse_error)
            print("[Gemini] Raw data:", json.dumps(data, indent=2))
            return "// Gemini returned unexpected structure"

        if not text:
            print("[Gemini] ⚠️ Empty response text – using fallback.")
            return "// Empty Gemini response"

        text = _strip_code_fences(text)
        print("[Gemini] ✅ Successfully parsed model output.")
        return text

    except requests.RequestException as e:
        print(f"[Gemini] Network or HTTP error: {e}")
        return f"// Gemini network error: {e}"
