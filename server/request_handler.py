#Ricky 2.1 ANd 4.2. Partt of the XandriaAI project
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .openai_client import suggest_snippet

router = APIRouter()

# ----- Schemas -----
class CodeRequest(BaseModel):
    code: str
    languageId: str
    fileName: str

class SnippetRequest(BaseModel):
    language: str
    codeContext: str

class SnippetResponse(BaseModel):
    snippet: str

# ----- Routes -----

@router.post("/analyze")
async def analyze_code(req: CodeRequest):
    """
    Request handler for incoming code snippets (mock analysis).
    Keep this for other subsystems (AST, SonarQube, Bandit, etc.).
    """
    if req.languageId == "python":
        result = {"subsystem": "AST Parser", "status": "parsed"}
    elif req.languageId in ["javascript", "typescript"]:
        result = {"subsystem": "Inline Suggestions", "status": "handled"}
    else:
        result = {"subsystem": "Fallback", "status": "unsupported"}

    return {
        "file": req.fileName,
        "language": req.languageId,
        "analysis": result
    }

@router.post("/snippet", response_model=SnippetResponse)
async def snippet(req: SnippetRequest):
    """
    4.2 OpenAI API Integration
    Called by the VS Code extension (src/apiClient.ts) at /api/snippet.
    Returns a single suggested code snippet as { "snippet": "..." }.
    """
    try:
        snippet_text = suggest_snippet(req.language, req.codeContext)
        return SnippetResponse(snippet=snippet_text)
    except Exception as exc:
        # Surface a clean error to the extension
        raise HTTPException(status_code=500, detail=f"Snippet generation failed: {exc}")

