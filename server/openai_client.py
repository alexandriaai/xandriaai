#Ricky 2.1 ANd 4.2. Partt of the XandriaAI project
import os
from typing import Optional

# Prefer the modern OpenAI client if available, but keep a soft fallback
_OpenAI = None
try:
    from openai import OpenAI          # pip install openai
    _OpenAI = OpenAI
except Exception:
    _OpenAI = None

MODEL_DEFAULT = os.getenv("XANDRIAAI_MODEL", "gpt-4o-mini")  # fast/cheap default

def _build_prompt(language: str, code: str) -> str:
    return (
        "You are XandriaAI. Suggest a concise, high-quality code snippet that improves or extends the user's context. "
        "Only return the code block—no prose. "
        f"Language: {language}\n\n"
        "User code/context:\n"
        "------------------\n"
        f"{code}\n"
        "------------------\n"
    )

def suggest_snippet(language: str, code_context: str) -> str:
    """
    Returns a code snippet string. Uses OpenAI if OPENAI_API_KEY is set;
    otherwise returns a deterministic fallback so the extension still works in class demos.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or not _OpenAI:
        # Safe fallback for classrooms / CI without keys
        header = f"// (fallback) Suggested snippet for {language}\n"
        body = "function hello() { return 'world'; }\n" if language.lower() in {"javascript","typescript"} \
               else "def hello():\n    return 'world'\n"
        return header + body

    client = _OpenAI(api_key=api_key)
    prompt = _build_prompt(language, code_context or "")

    # Chat Completions (compatible with 2024+ OpenAI SDK)
    resp = client.chat.completions.create(
        model=MODEL_DEFAULT,
        messages=[
            {"role": "system", "content": "You are a concise coding assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    text = (resp.choices[0].message.content or "").strip()
    # Strip surrounding code fences if the model returned ``` blocks
    if text.startswith("```"):
        # remove the first ```lang line and the trailing ```
        lines = text.splitlines()
        # drop first fence line; drop last fence line if it's ```
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text or "// (empty response)"
