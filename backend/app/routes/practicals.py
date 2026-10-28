import io
import zipfile
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Subject, Practical
from ..schemas import PracticalBase, PracticalCreate, PracticalUpdate, PracticalOut
from ..parser.language_detector import detect_language

router = APIRouter(tags=["Practicals"])

EXTENSION_MAP = {
    "cpp": "cpp",
    "c": "c",
    "python": "py",
    "java": "java",
    "sql": "sql",
    "javascript": "js",
    "html": "html",
    "bash": "sh",
    "r": "R",
    "text": "txt",
}


@router.get("/api/subjects/{subject_id}/practicals", response_model=List[PracticalOut])
def get_practicals_by_subject(
    subject_id: str,
    q: Optional[str] = Query(None, description="Search query in title or code"),
    language: Optional[str] = Query(None, description="Filter by language"),
    db: Session = Depends(get_db),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    query = db.query(Practical).filter(Practical.subject_id == subject_id)

    if language:
        query = query.filter(Practical.language.ilike(language.strip()))

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            (Practical.title.ilike(search_pattern)) |
            (Practical.code.ilike(search_pattern)) |
            (Practical.tags.ilike(search_pattern))
        )

    return query.order_by(Practical.practical_number.asc()).all()


@router.post("/api/subjects/{subject_id}/practicals", response_model=PracticalOut, status_code=status.HTTP_201_CREATED)
def create_practical(subject_id: str, payload: PracticalBase, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # If language is 'text' or empty, auto-detect from code
    lang = payload.language or "text"
    if lang == "text" or not lang:
        detected_lang, _ = detect_language(payload.code)
        lang = detected_lang

    new_practical = Practical(
        subject_id=subject_id,
        practical_number=payload.practical_number,
        title=payload.title.strip(),
        description=payload.description or "",
        language=lang,
        code=payload.code,
        tags=payload.tags or "",
    )
    db.add(new_practical)
    db.commit()
    db.refresh(new_practical)
    return new_practical


@router.get("/api/practicals/{practical_id}", response_model=PracticalOut)
def get_practical(practical_id: str, db: Session = Depends(get_db)):
    practical = db.query(Practical).filter(Practical.id == practical_id).first()
    if not practical:
        raise HTTPException(status_code=404, detail="Practical not found")
    return practical


@router.put("/api/practicals/{practical_id}", response_model=PracticalOut)
def update_practical(practical_id: str, payload: PracticalUpdate, db: Session = Depends(get_db)):
    practical = db.query(Practical).filter(Practical.id == practical_id).first()
    if not practical:
        raise HTTPException(status_code=404, detail="Practical not found")

    if payload.practical_number is not None:
        practical.practical_number = payload.practical_number
    if payload.title is not None:
        practical.title = payload.title.strip()
    if payload.description is not None:
        practical.description = payload.description
    if payload.language is not None:
        practical.language = payload.language.strip()
    if payload.code is not None:
        practical.code = payload.code
        # Auto-detect language if currently generic text
        if practical.language in ("text", "", None):
            det, _ = detect_language(practical.code)
            practical.language = det
    if payload.tags is not None:
        practical.tags = payload.tags

    db.commit()
    db.refresh(practical)
    return practical


@router.delete("/api/practicals/{practical_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_practical(
    practical_id: str,
    renumber: bool = Query(False, description="Renumber subsequent practicals"),
    db: Session = Depends(get_db)
):
    practical = db.query(Practical).filter(Practical.id == practical_id).first()
    if not practical:
        raise HTTPException(status_code=404, detail="Practical not found")
    
    subject_id = practical.subject_id
    p_num = practical.practical_number

    db.delete(practical)

    if renumber:
        # Shift down subsequent practical numbers by 1
        db.query(Practical).filter(
            Practical.subject_id == subject_id,
            Practical.practical_number > p_num
        ).update(
            {Practical.practical_number: Practical.practical_number - 1},
            synchronize_session=False
        )

    db.commit()
    return None


@router.get("/api/practicals/{practical_id}/export")
def export_practical_code(practical_id: str, db: Session = Depends(get_db)):
    practical = db.query(Practical).filter(Practical.id == practical_id).first()
    if not practical:
        raise HTTPException(status_code=404, detail="Practical not found")

    ext = EXTENSION_MAP.get(practical.language.lower(), "txt")
    filename = f"Practical_{practical.practical_number}_{practical.title.replace(' ', '_')[:30]}.{ext}"

    return Response(
        content=practical.code,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/api/subjects/{subject_id}/export-zip")
def export_subject_practicals_zip(subject_id: str, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    practicals = db.query(Practical).filter(Practical.subject_id == subject_id).order_by(Practical.practical_number.asc()).all()

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add a README.md summary
        readme_lines = [
            f"# {subject.code} — {subject.name}",
            f"**Semester:** {subject.semester}",
            f"**Total Practicals:** {len(practicals)}\n",
            "## Table of Experiments",
        ]
        for p in practicals:
            ext = EXTENSION_MAP.get(p.language.lower(), "txt")
            file_name = f"Practical_{p.practical_number:02d}_{p.title.replace(' ', '_')[:25]}.{ext}"
            readme_lines.append(f"- **Practical {p.practical_number}**: {p.title} (`{file_name}`)")
            zf.writestr(f"{subject.code}/{file_name}", p.code)

        zf.writestr(f"{subject.code}/README.md", "\n".join(readme_lines))

    zip_buffer.seek(0)
    zip_filename = f"{subject.code}_Practicals.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{zip_filename}"'}
    )
