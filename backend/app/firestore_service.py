import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from google.cloud.firestore_v1.base_query import FieldFilter
from .firebase_client import get_firestore_db
from .schemas import SubjectOut, PracticalOut, SubjectCreate, SubjectUpdate, PracticalBase, PracticalUpdate


def is_firestore_active() -> bool:
    return get_firestore_db() is not None


# -------------------------------------------------------------
# SUBJECTS FIRESTORE CRUD
# -------------------------------------------------------------

def fs_get_subjects() -> List[SubjectOut]:
    db = get_firestore_db()
    if not db:
        return []

    subjects_ref = db.collection("subjects")
    docs = subjects_ref.stream()

    results = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id

        # Count practicals for this subject
        practicals_ref = db.collection("practicals").where(filter=FieldFilter("subject_id", "==", d.id))
        # Using count aggregation query or stream
        p_count = len(list(practicals_ref.select([]).stream()))

        created_at = data.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at)
            except Exception:
                created_at = datetime.now(timezone.utc)
        elif not isinstance(created_at, datetime):
            created_at = datetime.now(timezone.utc)

        results.append(
            SubjectOut(
                id=d.id,
                code=data.get("code", ""),
                name=data.get("name", ""),
                semester=data.get("semester", "Semester 1"),
                department=data.get("department", "Computer Science & Engineering"),
                color=data.get("color", "#6366f1"),
                description=data.get("description", ""),
                created_at=created_at,
                practical_count=p_count,
            )
        )

    # Sort by created_at desc
    results.sort(key=lambda s: s.created_at, reverse=True)
    return results


def fs_get_subject_by_id(subject_id: str) -> Optional[SubjectOut]:
    db = get_firestore_db()
    if not db:
        return None

    doc = db.collection("subjects").document(subject_id).get()
    if not doc.exists:
        return None

    data = doc.to_dict()
    data["id"] = doc.id
    practicals_ref = db.collection("practicals").where(filter=FieldFilter("subject_id", "==", doc.id))
    p_count = len(list(practicals_ref.select([]).stream()))

    created_at = data.get("created_at")
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at)
        except Exception:
            created_at = datetime.now(timezone.utc)
    elif not isinstance(created_at, datetime):
        created_at = datetime.now(timezone.utc)

    return SubjectOut(
        id=doc.id,
        code=data.get("code", ""),
        name=data.get("name", ""),
        semester=data.get("semester", "Semester 1"),
        department=data.get("department", "Computer Science & Engineering"),
        color=data.get("color", "#6366f1"),
        description=data.get("description", ""),
        created_at=created_at,
        practical_count=p_count,
    )


def fs_create_subject(payload: SubjectCreate) -> SubjectOut:
    db = get_firestore_db()
    if not db:
        raise RuntimeError("Firestore is not initialized")

    code_clean = payload.code.strip()
    # Check uniqueness
    existing = list(db.collection("subjects").where(filter=FieldFilter("code", "==", code_clean)).limit(1).stream())
    if existing:
        raise ValueError(f"Subject with code '{code_clean}' already exists.")

    new_id = str(uuid.uuid4())
    now_dt = datetime.now(timezone.utc)

    doc_data = {
        "code": code_clean,
        "name": payload.name.strip(),
        "semester": payload.semester or "Semester 1",
        "department": payload.department or "Computer Science & Engineering",
        "color": payload.color or "#6366f1",
        "description": payload.description or "",
        "created_at": now_dt.isoformat(),
    }

    db.collection("subjects").document(new_id).set(doc_data)

    return SubjectOut(
        id=new_id,
        code=doc_data["code"],
        name=doc_data["name"],
        semester=doc_data["semester"],
        department=doc_data["department"],
        color=doc_data["color"],
        description=doc_data["description"],
        created_at=now_dt,
        practical_count=0,
    )


def fs_update_subject(subject_id: str, payload: SubjectUpdate) -> Optional[SubjectOut]:
    db = get_firestore_db()
    if not db:
        return None

    doc_ref = db.collection("subjects").document(subject_id)
    doc = doc_ref.get()
    if not doc.exists:
        return None

    update_fields = {}
    if payload.code is not None:
        code_clean = payload.code.strip()
        # Check duplicate if changed
        existing = list(db.collection("subjects").where(filter=FieldFilter("code", "==", code_clean)).stream())
        if any(e.id != subject_id for e in existing):
            raise ValueError(f"Subject code '{code_clean}' is already in use.")
        update_fields["code"] = code_clean

    if payload.name is not None:
        update_fields["name"] = payload.name.strip()
    if payload.semester is not None:
        update_fields["semester"] = payload.semester
    if payload.department is not None:
        update_fields["department"] = payload.department
    if payload.color is not None:
        update_fields["color"] = payload.color
    if payload.description is not None:
        update_fields["description"] = payload.description

    if update_fields:
        doc_ref.update(update_fields)

    return fs_get_subject_by_id(subject_id)


def fs_delete_subject(subject_id: str) -> bool:
    db = get_firestore_db()
    if not db:
        return False

    doc_ref = db.collection("subjects").document(subject_id)
    if not doc_ref.get().exists:
        return False

    # Cascade delete all child practicals
    practicals_stream = db.collection("practicals").where(filter=FieldFilter("subject_id", "==", subject_id)).stream()
    batch = db.batch()
    for p_doc in practicals_stream:
        batch.delete(p_doc.reference)
    batch.delete(doc_ref)
    batch.commit()
    return True


# -------------------------------------------------------------
# PRACTICALS FIRESTORE CRUD
# -------------------------------------------------------------

def fs_get_practicals_by_subject(subject_id: str, q: Optional[str] = None, language: Optional[str] = None) -> List[PracticalOut]:
    db = get_firestore_db()
    if not db:
        return []

    query = db.collection("practicals").where(filter=FieldFilter("subject_id", "==", subject_id))
    docs = query.stream()

    results = []
    q_lower = q.strip().lower() if q else None
    lang_lower = language.strip().lower() if language else None

    for d in docs:
        data = d.to_dict()
        data["id"] = d.id

        item_lang = (data.get("language") or "").lower()
        if lang_lower and item_lang != lang_lower:
            continue

        item_title = data.get("title") or ""
        item_code = data.get("code") or ""
        item_tags = data.get("tags") or ""

        if q_lower:
            if q_lower not in item_title.lower() and q_lower not in item_code.lower() and q_lower not in item_tags.lower():
                continue

        created_at = data.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at)
            except Exception:
                created_at = datetime.now(timezone.utc)
        elif not isinstance(created_at, datetime):
            created_at = datetime.now(timezone.utc)

        updated_at = data.get("updated_at")
        if isinstance(updated_at, str):
            try:
                updated_at = datetime.fromisoformat(updated_at)
            except Exception:
                updated_at = created_at
        elif not isinstance(updated_at, datetime):
            updated_at = created_at

        results.append(
            PracticalOut(
                id=d.id,
                subject_id=subject_id,
                practical_number=int(data.get("practical_number", 1)),
                title=item_title,
                language=data.get("language", "text"),
                description=data.get("description", ""),
                code=item_code,
                tags=item_tags,
                discarded_output=data.get("discarded_output", ""),
                created_at=created_at,
                updated_at=updated_at,
            )
        )

    results.sort(key=lambda p: p.practical_number)
    return results


def fs_get_practical_by_id(practical_id: str) -> Optional[PracticalOut]:
    db = get_firestore_db()
    if not db:
        return None

    doc = db.collection("practicals").document(practical_id).get()
    if not doc.exists:
        return None

    data = doc.to_dict()
    created_at = data.get("created_at")
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at)
        except Exception:
            created_at = datetime.now(timezone.utc)
    elif not isinstance(created_at, datetime):
        created_at = datetime.now(timezone.utc)

    updated_at = data.get("updated_at")
    if isinstance(updated_at, str):
        try:
            updated_at = datetime.fromisoformat(updated_at)
        except Exception:
            updated_at = created_at
    elif not isinstance(updated_at, datetime):
        updated_at = created_at

    return PracticalOut(
        id=doc.id,
        subject_id=data.get("subject_id", ""),
        practical_number=int(data.get("practical_number", 1)),
        title=data.get("title", ""),
        language=data.get("language", "text"),
        description=data.get("description", ""),
        code=data.get("code", ""),
        tags=data.get("tags", ""),
        discarded_output=data.get("discarded_output", ""),
        created_at=created_at,
        updated_at=updated_at,
    )


def fs_create_practical(subject_id: str, payload: PracticalBase) -> PracticalOut:
    db = get_firestore_db()
    if not db:
        raise RuntimeError("Firestore is not initialized")

    new_id = str(uuid.uuid4())
    now_dt = datetime.now(timezone.utc)

    doc_data = {
        "subject_id": subject_id,
        "practical_number": int(payload.practical_number),
        "title": payload.title.strip(),
        "language": (payload.language or "text").lower(),
        "description": payload.description or "",
        "code": payload.code,
        "tags": payload.tags or "",
        "discarded_output": getattr(payload, "discarded_output", "") or "",
        "created_at": now_dt.isoformat(),
        "updated_at": now_dt.isoformat(),
    }

    db.collection("practicals").document(new_id).set(doc_data)

    return PracticalOut(
        id=new_id,
        subject_id=subject_id,
        practical_number=doc_data["practical_number"],
        title=doc_data["title"],
        language=doc_data["language"],
        description=doc_data["description"],
        code=doc_data["code"],
        tags=doc_data["tags"],
        discarded_output=doc_data["discarded_output"],
        created_at=now_dt,
        updated_at=now_dt,
    )


def fs_update_practical(practical_id: str, payload: PracticalUpdate) -> Optional[PracticalOut]:
    db = get_firestore_db()
    if not db:
        return None

    doc_ref = db.collection("practicals").document(practical_id)
    doc = doc_ref.get()
    if not doc.exists:
        return None

    now_dt = datetime.now(timezone.utc)
    update_data: Dict[str, Any] = {"updated_at": now_dt.isoformat()}

    if payload.practical_number is not None:
        update_data["practical_number"] = int(payload.practical_number)
    if payload.title is not None:
        update_data["title"] = payload.title.strip()
    if payload.language is not None:
        update_data["language"] = payload.language.lower()
    if payload.description is not None:
        update_data["description"] = payload.description
    if payload.code is not None:
        update_data["code"] = payload.code
    if payload.tags is not None:
        update_data["tags"] = payload.tags
    if payload.discarded_output is not None:
        update_data["discarded_output"] = payload.discarded_output

    doc_ref.update(update_data)
    return fs_get_practical_by_id(practical_id)


def fs_delete_practical(practical_id: str, renumber: bool = True) -> bool:
    db = get_firestore_db()
    if not db:
        return False

    doc_ref = db.collection("practicals").document(practical_id)
    doc = doc_ref.get()
    if not doc.exists:
        return False

    subject_id = doc.to_dict().get("subject_id")
    doc_ref.delete()

    if renumber and subject_id:
        # Atomic renumbering of remaining practicals
        remaining = list(db.collection("practicals").where(filter=FieldFilter("subject_id", "==", subject_id)).stream())
        # Sort by practical_number
        sorted_remaining = sorted(remaining, key=lambda d: int(d.to_dict().get("practical_number", 0)))
        batch = db.batch()
        for idx, r_doc in enumerate(sorted_remaining, start=1):
            batch.update(r_doc.reference, {"practical_number": idx})
        batch.commit()

    return True


def fs_batch_commit_practicals(subject_id: str, practicals_data: List[dict]) -> int:
    db = get_firestore_db()
    if not db:
        return 0

    batch = db.batch()
    now_dt = datetime.now(timezone.utc)
    count = 0

    for item in practicals_data:
        new_id = str(uuid.uuid4())
        doc_ref = db.collection("practicals").document(new_id)
        batch.set(doc_ref, {
            "subject_id": subject_id,
            "practical_number": int(item.get("practical_number", count + 1)),
            "title": item.get("title", f"Practical {count + 1}"),
            "language": item.get("language", "text").lower(),
            "description": item.get("description", ""),
            "code": item.get("code", ""),
            "tags": item.get("tags", ""),
            "discarded_output": item.get("discarded_output", ""),
            "created_at": now_dt.isoformat(),
            "updated_at": now_dt.isoformat(),
        })
        count += 1

    batch.commit()
    return count
