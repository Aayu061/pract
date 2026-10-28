from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Subject, Practical
from ..schemas import SubjectCreate, SubjectUpdate, SubjectOut
from ..firestore_service import (
    is_firestore_active,
    fs_get_subjects,
    fs_get_subject_by_id,
    fs_create_subject,
    fs_update_subject,
    fs_delete_subject,
)

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])


@router.get("", response_model=List[SubjectOut])
def get_subjects(db: Session = Depends(get_db)):
    if is_firestore_active():
        return fs_get_subjects()

    subjects = db.query(Subject).order_by(Subject.created_at.desc()).all()
    results = []
    for s in subjects:
        count = db.query(func.count(Practical.id)).filter(Practical.subject_id == s.id).scalar() or 0
        s_out = SubjectOut(
            id=s.id,
            code=s.code,
            name=s.name,
            semester=s.semester or "Semester 1",
            department=s.department or "Computer Science & Engineering",
            color=s.color or "#6366f1",
            description=s.description or "",
            created_at=s.created_at,
            practical_count=count,
        )
        results.append(s_out)
    return results


@router.post("", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db)):
    if is_firestore_active():
        try:
            return fs_create_subject(payload)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Check if subject with same code already exists
    existing = db.query(Subject).filter(Subject.code == payload.code.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Subject with code '{payload.code}' already exists.")

    new_sub = Subject(
        code=payload.code.strip(),
        name=payload.name.strip(),
        semester=payload.semester or "Semester 1",
        department=payload.department or "Computer Science & Engineering",
        color=payload.color or "#6366f1",
        description=payload.description or "",
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return SubjectOut(
        id=new_sub.id,
        code=new_sub.code,
        name=new_sub.name,
        semester=new_sub.semester,
        department=new_sub.department,
        color=new_sub.color,
        description=new_sub.description,
        created_at=new_sub.created_at,
        practical_count=0,
    )


@router.get("/{subject_id}", response_model=SubjectOut)
def get_subject(subject_id: str, db: Session = Depends(get_db)):
    if is_firestore_active():
        sub = fs_get_subject_by_id(subject_id)
        if not sub:
            raise HTTPException(status_code=404, detail="Subject not found")
        return sub

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    count = db.query(func.count(Practical.id)).filter(Practical.subject_id == subject.id).scalar() or 0
    return SubjectOut(
        id=subject.id,
        code=subject.code,
        name=subject.name,
        semester=subject.semester,
        department=subject.department,
        color=subject.color,
        description=subject.description,
        created_at=subject.created_at,
        practical_count=count,
    )


@router.put("/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: str, payload: SubjectUpdate, db: Session = Depends(get_db)):
    if is_firestore_active():
        try:
            sub = fs_update_subject(subject_id, payload)
            if not sub:
                raise HTTPException(status_code=404, detail="Subject not found")
            return sub
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if payload.code is not None:
        subject.code = payload.code.strip()
    if payload.name is not None:
        subject.name = payload.name.strip()
    if payload.semester is not None:
        subject.semester = payload.semester
    if payload.department is not None:
        subject.department = payload.department
    if payload.color is not None:
        subject.color = payload.color
    if payload.description is not None:
        subject.description = payload.description

    db.commit()
    db.refresh(subject)
    count = db.query(func.count(Practical.id)).filter(Practical.subject_id == subject.id).scalar() or 0
    return SubjectOut(
        id=subject.id,
        code=subject.code,
        name=subject.name,
        semester=subject.semester,
        department=subject.department,
        color=subject.color,
        description=subject.description,
        created_at=subject.created_at,
        practical_count=count,
    )


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: str, db: Session = Depends(get_db)):
    if is_firestore_active():
        success = fs_delete_subject(subject_id)
        if not success:
            raise HTTPException(status_code=404, detail="Subject not found")
        return None

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Explicitly remove all child practicals first to guarantee atomic cascade in SQLite
    db.query(Practical).filter(Practical.subject_id == subject_id).delete(synchronize_session=False)
    db.delete(subject)
    db.commit()
    return None
