from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import logging
import time

load_dotenv()

from database import engine, Base
from auth.router import router as auth_router
from reports.router import router as reports_router
import auth.models   # noqa: F401
import reports.models  # noqa: F401

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("research_agent")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing needed since Alembic manages the schema
    # Remove create_all — Alembic is your migration tool now
    logger.info("Research Agent API starting up")
    yield
    # Shutdown
    await engine.dispose()
    logger.info("Research Agent API shut down")


app = FastAPI(
    title="Research Agent API",
    version="1.0.0",
    description="Multi-agent AI research platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000)
    response.headers["X-Response-Time"] = f"{duration_ms}ms"
    if duration_ms > 1000:
        logger.warning(f"Slow request: {request.method} {request.url.path} took {duration_ms}ms")
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


app.include_router(auth_router)
app.include_router(reports_router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "service": "Research Agent API",
    }