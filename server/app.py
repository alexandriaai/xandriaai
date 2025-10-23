# Ricky 2.1 and 4.2 - Part of the XandriaAI project
# Updated by Alexandra – Configuration file integration (Task 18.1)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.request_handler import router as request_router
from dotenv import load_dotenv
import json
import os

# ---------------------------
# ✅ Load .env from project root (one level up from /server/)
# ---------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH, override=True)
    print(f"🔍 .env loaded from: {ENV_PATH}")
else:
    print(f"⚠️  .env file not found at expected path: {ENV_PATH}")

# Explicitly print working directory for clarity
print(f"📂 Current working directory: {os.getcwd()}")

# ✅ Check and display whether the Gemini key was loaded
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    print("🔑 GEMINI_API_KEY detected successfully.")
else:
    print("❌ GEMINI_API_KEY not found. Check your .env formatting and location.")

# ---------------------------
# ✅ Load config.json dynamically
# ---------------------------
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
if os.path.exists(CONFIG_PATH):
    with open(CONFIG_PATH, "r") as f:
        CONFIG = json.load(f)
else:
    raise FileNotFoundError(f"❌ config.json not found at {CONFIG_PATH}")

# ---------------------------
# ✅ Initialize FastAPI app
# ---------------------------
app = FastAPI(title=f"{CONFIG['projectName']} Backend")

# ---------------------------
# ✅ Enable CORS for extension access
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict later if needed
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# ✅ Root endpoint
# ---------------------------
@app.get("/")
async def root():
    return {
        "message": f"{CONFIG['projectName']} backend running",
        "version": CONFIG["version"],
        "backend_uri": CONFIG["backend"]["uri"],
    }

# ---------------------------
# ✅ API Routes
# ---------------------------
app.include_router(request_router, prefix="/api")

# ---------------------------
# ✅ Startup log
# ---------------------------
@app.on_event("startup")
async def startup_event():
    print(f"✅ Loaded configuration for {CONFIG['projectName']} v{CONFIG['version']}")
    print(f"Backend URI: {CONFIG['backend']['uri']}")
    print(f"Reload mode: {CONFIG['backend']['reload']}")
