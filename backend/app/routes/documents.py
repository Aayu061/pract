import os
import shutil
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..config import DOCUMENTS_DIR
from ..models import Document, Subject
from ..schemas import DocumentOut, DocxPreviewResponse
from ..parser.docx_html_renderer import render_docx_to_html
from ..parser.docx_extractor import parse_docx_file
from ..firestore_service import is_firestore_active

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

        # 3. Store record in database
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
        db.refresh(doc_record)

        return {
            "id": doc_record.id,
            "subject_id": doc_record.subject_id,
            "filename": doc_record.filename,
            "file_size": doc_record.file_size,
            "parsed_practical_count": doc_record.parsed_practical_count,
            "created_at": doc_record.created_at,
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
    query = db.query(Document)
    if subject_id:
        query = query.filter(Document.subject_id == subject_id)
    return query.order_by(Document.created_at.desc()).all()


@router.get("/{document_id}/html")
def get_document_html(document_id: str, db: Session = Depends(get_db)):
    """
    Returns styled HTML content and TOC for the document viewer.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document not found on disk")

    rendered = render_docx_to_html(doc.file_path)
    return {
        "id": doc.id,
        "filename": doc.filename,
        "subject_id": doc.subject_id,
        "file_size": doc.file_size,
        "created_at": doc.created_at,
        "html": rendered["html"],
        "toc": rendered["toc"],
        "word_count": rendered["word_count"],
    }


@router.get("/{document_id}/download")
def download_document(document_id: str, db: Session = Depends(get_db)):
    """
    Downloads original .docx file.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document not found on disk")

    return FileResponse(
        path=doc.file_path,
        filename=doc.filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """
    Deletes document record and associated disk file.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass

    db.delete(doc)
    db.commit()
    return None
