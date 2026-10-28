import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..config import UPLOAD_DIR
from ..models import Subject, Practical
from ..schemas import DocxPreviewResponse, IngestionCommitRequest, PracticalOut
from ..parser.docx_extractor import parse_docx_file
from ..firestore_service import (
    is_firestore_active,
    fs_get_subject_by_id,
    fs_batch_commit_practicals,
    fs_get_practicals_by_subject,
)

router = APIRouter(prefix="/api/ingest", tags=["Ingestion"])


@router.post("/preview-docx", response_model=DocxPreviewResponse)
async def preview_docx(file: UploadFile = File(...)):
    """
    Receives uploaded .docx file, runs smart separation and output-elimination algorithm,
    and returns parsed practicals preview for user verification.
    """
    if not file.filename.lower().endswith(".docx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .docx files are supported. Please upload a Word Document."
        )

    # Save to temporary path
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_path = UPLOAD_DIR / temp_filename

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Execute algorithmic parser
        preview_data = parse_docx_file(str(temp_path))
        return preview_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse .docx file: {str(e)}"
        )
    finally:
        # Cleanup temporary uploaded file
        if temp_path.exists():
            try:
                os.remove(temp_path)
            except OSError:
                pass


@router.post("/commit", response_model=List[PracticalOut], status_code=status.HTTP_201_CREATED)
def commit_ingested_practicals(payload: IngestionCommitRequest, db: Session = Depends(get_db)):
    """
    Commits approved practicals from the preview step into the target subject.
    """
    if is_firestore_active():
        subject = fs_get_subject_by_id(payload.subject_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Target Subject not found")

        items_dict = [p.dict() for p in payload.practicals]
        fs_batch_commit_practicals(payload.subject_id, items_dict)
        return fs_get_practicals_by_subject(payload.subject_id)

    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Target Subject not found")

    created_items: List[Practical] = []

    # Get max current practical number in subject to prevent accidental collisions if needed
    current_max_num = db.query(Practical.practical_number).filter(Practical.subject_id == payload.subject_id).order_by(Practical.practical_number.desc()).first()
    start_num = (current_max_num[0] + 1) if current_max_num else 1

    for idx, item in enumerate(payload.practicals):
        # If practical number is 0 or collides, calculate safe number
        p_num = item.practical_number if item.practical_number > 0 else (start_num + idx)

        practical = Practical(
            subject_id=payload.subject_id,
            practical_number=p_num,
            title=item.title.strip() or f"Practical {p_num}",
            description=item.description or "",
            language=item.language or "text",
            code=item.code,
            tags=item.tags or "",
            discarded_output=item.discarded_output or "",
        )
        db.add(practical)
        created_items.append(practical)

    db.commit()
    for item in created_items:
        db.refresh(item)

    return created_items
