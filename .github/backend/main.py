from fastapi import FastAPI
from request_handler import handle_request

app = FastAPI()

@app.get("/")
def home():
    return {"message": "XandriaAI backend is live!"}

@app.post("/process")
async def process_request(request: dict):
    return handle_request(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
