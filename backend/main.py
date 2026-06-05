from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
from auth.router import router as auth_router
from reports.router import router as reports_router

# Import models so SQLAlchemy registers them before create_all
import auth.models  # noqa: F401
import reports.models  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Research Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(reports_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}