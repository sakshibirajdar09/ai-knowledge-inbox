import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend_py directory
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

PORT: int = int(os.getenv("PORT", "3000"))
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# Determine SQLite database path
env_db_path = os.getenv("DATABASE_PATH")
if env_db_path:
    DATABASE_PATH = Path(env_db_path)
    if not DATABASE_PATH.is_absolute():
        DATABASE_PATH = (BASE_DIR / DATABASE_PATH).resolve()
else:
    DATABASE_PATH = (BASE_DIR / "data" / "knowledge.db").resolve()

# AI & RAG defaults matching TypeScript backend
SIMILARITY_THRESHOLD: float = 0.65
TOP_K_CHUNKS: int = 15
DEFAULT_CHUNK_SIZE: int = 500
DEFAULT_CHUNK_OVERLAP: int = 100
