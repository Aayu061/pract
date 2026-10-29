import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..config import DOCUMENTS_DIR
from ..models import Document, Subject
from ..schemas import DocumentOut, DocxPreviewResponse
from ..parser.docx_html_renderer import render_docx_to_html
from ..parser.docx_extractor import parse_docx_file
from ..firestore_service import (
    is_firestore_active,
    fs_store_document,
    fs_get_documents,
    fs_get_document_by_id,
    fs_delete_document,
)

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    subject_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Uploads and permanently stores a .docx manual, renders it into styled HTML for viewing,
    and extracts practicals for import.
    Compatible with both Firestore and SQLite backends.
    """
    if not file.filename.lower().endswith(".docx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .docx documents are supported."
        )

    doc_id = str(uuid.uuid4())
    stored_filename = f"{doc_id}_{file.filename}"
    saved_path = DOCUMENTS_DIR / stored_filename

    try:
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(saved_path)

        # 1. Render to HTML
        rendered = render_docx_to_html(str(saved_path))

        # 2. Extract practicals for separation preview
        parsed = parse_docx_file(str(saved_path))
        practical_count = parsed.get("total_practicals_found", 0)

        # 3. Store record in Firestore if active
        if is_firestore_active():
            fs_store_document(
                doc_id=doc_id,
                subject_id=subject_id or None,
                filename=file.filename,
                file_path=str(saved_path),
                file_size=file_size,
                parsed_practical_count=practical_count,
            )

        # 4. Safely store in SQLite (ignoring foreign key errors if subjects are in Firestore)
        try:
            doc_record = Document(
                id=doc_id,
                subject_id=subject_id or None,
                filename=file.filename,
                file_path=str(saved_path),
                file_size=file_size,
                parsed_practical_count=practical_count,
            )
            db.add(doc_record)
            db.commit()
        except Exception:
            db.rollback()
            # If Firestore is active, SQLite sync failure is non-fatal

        now_dt = datetime.now(timezone.utc)
        return {
            "id": doc_id,
            "subject_id": subject_id or None,
            "filename": file.filename,
            "file_size": file_size,
            "parsed_practical_count": practical_count,
            "created_at": now_dt,
            "html": rendered["html"],
            "toc": rendered["toc"],
            "word_count": rendered["word_count"],
            "practicals_preview": parsed,
        }
    except Exception as e:
        if saved_path.exists():
            try:
                os.remove(saved_path)
            except OSError:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )


@router.get("", response_model=List[DocumentOut])
def list_documents(subject_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns list of all uploaded documents, optionally filtered by subject.
    """
    if is_firestore_active():
        return fs_get_documents(subject_id)

    query = db.query(Document)
    if subject_id:
        query = query.filter(Document.subject_id == subject_id)
    return query.order_by(Document.created_at.desc()).all()


@router.get("/{document_id}/html")
def get_document_html(document_id: str, db: Session = Depends(get_db)):
    """
    Returns styled HTML content and TOC for the document viewer.
    """
    file_path = None
    filename = None
    subject_id = None
    file_size = 0
    created_at = None

    if is_firestore_active():
        doc_data = fs_get_document_by_id(document_id)
        if doc_data:
            file_path = doc_data.get("file_path")
            filename = doc_data.get("filename")
            subject_id = doc_data.get("subject_id")
            file_size = doc_data.get("file_size", 0)
            created_at = doc_data.get("created_at")

    if not file_path:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            file_path = doc.file_path
            filename = doc.filename
            subject_id = doc.subject_id
            file_size = doc.file_size
            created_at = doc.created_at

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document not found on disk")

    rendered = render_docx_to_html(file_path)
    return {
        "id": document_id,
        "filename": filename or "document.docx",
        "subject_id": subject_id,
        "file_size": file_size,
        "created_at": created_at,
        "html": rendered["html"],
        "toc": rendered["toc"],
        "word_count": rendered["word_count"],
    }


@router.get("/{document_id}/download")
def download_document(document_id: str, db: Session = Depends(get_db)):
    """
    Downloads original .docx file.
    """
    file_path = None
    filename = None

    if is_firestore_active():
        doc_data = fs_get_document_by_id(document_id)
        if doc_data:
            file_path = doc_data.get("file_path")
            filename = doc_data.get("filename")

    if not file_path:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            file_path = doc.file_path
            filename = doc.filename

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document not found on disk")

    return FileResponse(
        path=file_path,
        filename=filename or "document.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """
    Deletes document record and associated disk file.
    """
    file_path = None

    if is_firestore_active():
        doc_data = fs_get_document_by_id(document_id)
        if doc_data:
            file_path = doc_data.get("file_path")
            fs_delete_document(document_id)

    doc = db.query(Document).filter(Document.id == document_id).first()
    if doc:
        file_path = file_path or doc.file_path
        db.delete(doc)
        db.commit()

    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

    return None
