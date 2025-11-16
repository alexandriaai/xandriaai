# server/request_handler.py
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import ast

# AI provider: use Gemini (replace old OpenAI import)
from server.gemini_client import suggest_snippet_with_gemini

# Bandit security scan (Task 5.1)
from server.bandit_runner import run_bandit

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
    """Request handler for AST parsing and other analysis subsystems."""
    if req.languageId == "python":
        try:
            tree = ast.parse(req.code)
            functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
            classes = [node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
            result = {"subsystem": "AST Parser", "status": "parsed", "functions": functions, "classes": classes}
        except SyntaxError as e:
            result = {"subsystem": "AST Parser", "status": "error", "message": f"Syntax error: {str(e)}"}
    elif req.languageId in ["javascript", "typescript"]:
        result = {"subsystem": "Inline Suggestions", "status": "handled"}
    else:
        result = {"subsystem": "Fallback", "status": "unsupported"}

    return {"file": req.fileName, "language": req.languageId, "analysis": result}


@router.post("/snippet", response_model=SnippetResponse)
async def snippet(req: SnippetRequest):
    """Generate AI code snippet using Gemini."""
    try:
        snippet_text = suggest_snippet_with_gemini(req.language, req.codeContext)
        return SnippetResponse(snippet=snippet_text)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Snippet generation failed: {exc}")


@router.get("/security/bandit")
async def security_bandit():
    """Run Bandit security scan and return parsed findings."""
    report = run_bandit(["server"])
    if not report.get("ok"):
        raise HTTPException(status_code=500, detail=report.get("error", "Bandit failed"))
    return report


# ----- Main Entry for /process -----
def handle_request(request: dict):
    """Entry point used by main.py for local and Render testing."""
    try:
        # Extract input data
        language = request.get("language", "python")
        code_context = request.get("codeContext", "")

        # Generate snippet using Gemini model
        snippet_text = suggest_snippet_with_gemini(language, code_context)

        # Return valid JSON response for frontend
        return {"snippet": snippet_text}

    except Exception as e:
        # Return error safely to frontend if something fails
        return {"error": f"Snippet generation failed: {str(e)}"}
