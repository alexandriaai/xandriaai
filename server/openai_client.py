# Ricky 2.1 + 4.2, Alexandra 4.1 – Prompt Engineering for XandriaAI project
import os
from typing import Optional

# Prefer the modern OpenAI client if available, but keep a soft fallback
_OpenAI = None
try:
    from openai import OpenAI  # pip install openai
    _OpenAI = OpenAI
except Exception:
    _OpenAI = None

MODEL_DEFAULT = os.getenv("XANDRIAAI_MODEL", "gpt-4o-mini")  # fast/cheap default


# --------------------------
# 4.1 Prompt Engineering
# --------------------------
def build_prompt(language: str, file_name: str, code: str) -> str:
    """
    Builds a structured prompt that guides ChatGPT to:
      1. Suggest improvements or bug fixes
      2. Add inline comments explaining important lines
      3. Provide a short summary (2–3 sentences) of what this code does
    Output format: strict JSON
    """
    return f"""
Your tasks:
1. Suggest improvements or bug fixes if needed.
2. Add clear inline comments explaining important lines.
3. Provide a short summary (2–3 sentences) of what this code does.

Output your response in structured JSON with these fields:
{{
  "suggested_code": "string",
  "comments": ["string", "string"],
  "summary": "string"
}}

The user is coding in **{language}**.
File name: `{file_name}`

Here is the code to analyze:
------------------------
{code}
------------------------
"""


# --------------------------
# Original Simple Prompt (kept for fallback/compatibility)
# --------------------------
def _build_prompt(language: str, code: str) -> str:
    """
    The old simple prompt (used only for fallback).
    """
    return (
        "You are XandriaAI. Suggest a concise, high-quality code snippet that improves or extends the user's context. "
        "Only return the code block—no prose. "
        f"Language: {language}\n\n"
        "User code/context:\n"
        "------------------\n"
        f"{code}\n"
        "------------------\n"
    )


# --------------------------
# Snippet Suggestion Function
# --------------------------
def suggest_snippet(language: str, code_context: str) -> str:
    """
    Returns a code suggestion string.
    Uses OpenAI if OPENAI_API_KEY is set; otherwise returns a deterministic fallback
    so the extension still works in class demos.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or not _OpenAI:
        # Safe fallback for classrooms / CI without keys
        header = f"// (fallback) Suggested snippet for {language}\n"
        body = (
            "function hello() { return 'world'; }\n"
            if language.lower() in {"javascript", "typescript"}
            else "def hello():\n    return 'world'\n"
        )
        return header + body

    client = _OpenAI(api_key=api_key)

    # ✅ Use the new structured 4.1 prompt
    prompt = build_prompt(language, "user_file.py", code_context or "")

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
        lines = text.splitlines()
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    return text or "// (empty response)"
