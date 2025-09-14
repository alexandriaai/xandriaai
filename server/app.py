#Ricky 2.1 ANd 4.2. Partt of the XandriaAI project

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .request_handler import router as request_router

app = FastAPI(title="XandriaAI Backend")

# Allow the VS Code extension to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # lock down later if you have a fixed origin
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "XandriaAI backend running"}

# All API routes are under /api (matches the extension client)
app.include_router(request_router, prefix="/api")
