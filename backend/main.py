from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from routes.upload import router as upload_router
from routes.rank import router as rank_router
from routes.trust import router as trust_router
from routes.interview import router as interview_router

app = FastAPI(title="AI Recruiter")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(rank_router)
app.include_router(trust_router)
app.include_router(interview_router)

@app.get("/")
def home():
    return {"message": "AI Recruiter Running"}