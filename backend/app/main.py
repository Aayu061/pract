from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import CORS_ORIGINS
from .database import engine, Base
from .routes import subjects, practicals, ingestion, documents

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CS Practical Portal API",
    description="Backend API for Computer Science practical repository with automated DOCX separation and code extraction",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(subjects.router)
app.include_router(practicals.router)
app.include_router(ingestion.router)
app.include_router(documents.router)



@app.get("/")
@app.get("/healthz")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "CS Practical Portal API"}
