from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.request_handler import handle_request

app = FastAPI()

# --- Add this block ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow requests from anywhere (VS Code frontend, browser, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------

@app.get("/")
def home():
    return {"message": "XandriaAI backend is live!"}

@app.post("/process")
async def process_request(request: dict):
    return handle_request(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
