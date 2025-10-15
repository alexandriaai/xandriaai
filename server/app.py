# Ricky 2.1 and 4.2 - Part of the XandriaAI project
# Updated by Alexandra – Configuration file integration (Task 18.1)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .request_handler import router as request_router

from dotenv import load_dotenv
import json
import os

# Load .env automatically
load_dotenv()

# ---------------------------
# Load config.json dynamically
# ---------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")

with open(CONFIG_PATH, "r") as f:
    CONFIG = json.load(f)

app = FastAPI(title=f"{CONFIG['projectName']} Backend")

# ---------------------------
# CORS Configuration
# ---------------------------
allowed_origins = ["*"]  # Later, you can replace this with CONFIG["frontend"]["allowedOrigins"] if added

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Root Endpoint
# ---------------------------
@app.get("/")
async def root():
    return {
        "message": f"{CONFIG['projectName']} backend running",
        "version": CONFIG["version"],
        "backend_uri": CONFIG["backend"]["uri"],
    }

# ---------------------------
# API Routes
# ---------------------------
app.include_router(request_router, prefix="/api")

# ---------------------------
# Startup Log (Optional)
# ---------------------------
@app.on_event("startup")
async def startup_event():
    print(f"✅ Loaded configuration for {CONFIG['projectName']} v{CONFIG['version']}")
    print(f"Backend URI: {CONFIG['backend']['uri']}")
    print(f"Reload mode: {CONFIG['backend']['reload']}")
