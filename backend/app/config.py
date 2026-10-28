import os
import tempfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# In Vercel / AWS Lambda, application filesystem is read-only; use /tmp for data & uploads
if os.environ.get("VERCEL") == "1" or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    DATA_DIR = Path(tempfile.gettempdir()) / "practicals_data"
else:
    DATA_DIR = BASE_DIR / "data"

DATA_DIR.mkdir(parents=True, exist_ok=True)

UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DOCUMENTS_DIR = UPLOAD_DIR / "documents"
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)


DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DATA_DIR / 'practicals.db'}")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]
