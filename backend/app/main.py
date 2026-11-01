from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import ENVIRONMENT
from app.db.database import init_db
from app.utils.errors import AppException
from app.utils.logger import logger
from app.routers import ingest, query, items

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    init_db()
    yield
    # Shutdown

app = FastAPI(
    title="AI Knowledge Inbox API",
    description="Python backend providing RAG semantic search and ingestion for RecallAI",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend & Chrome Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Unified Error Handler for AppException
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    logger.error(f"[{request.method}] {request.url.path} failed - {exc.error_code}: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message
            }
        }
    )

# Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_msg = "; ".join([f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()])
    logger.error(f"[{request.method}] {request.url.path} validation failed: {error_msg}")
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "INVALID_REQUEST",
                "message": error_msg
            }
        }
    )

# Generic Uncaught Exception Handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"[{request.method}] {request.url.path} unhandled error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred"
            }
        }
    )

# Health endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "AI Knowledge Inbox API (Python/FastAPI) is running"}

# Register routers
app.include_router(ingest.router)
app.include_router(query.router)
app.include_router(items.router)
