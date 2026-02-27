"""VoiceCoach API — FastAPI app with CORS and routers."""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import session, feedback, research, health

app = FastAPI(
    title="VoiceCoach AI",
    description="Adaptive AI interview trainer — Modulate, Yutori, Fastino",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(feedback.router)
app.include_router(research.router)
app.include_router(health.router)


@app.get("/")
async def root():
    return {"app": "VoiceCoach AI", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
