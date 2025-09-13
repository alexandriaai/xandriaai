from fastapi import FastAPI
from .request_handler import router as request_router


app = FastAPI()   


app.include_router(request_router)

@app.get("/")
async def root():
    return {"message": "XandriaAI backend running"}
