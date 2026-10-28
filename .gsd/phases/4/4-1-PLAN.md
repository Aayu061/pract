---
phase: 4
plan: 1
wave: 1
gap_closure: false
---

# Plan 4.1: Database Model & Schema Correction

## Objective
Harmonize the backend database models and Pydantic schemas to fix the fatal SQLAlchemy crash on `discarded_output`, correct the `IngestionCommitItem` schema mismatch, enable SQLite foreign key constraints, and introduce the `Document` model for persistent manual storage.

## Context
Load these files for context:
- .gsd/SPEC.md
- backend/app/models.py
- backend/app/schemas.py
- backend/app/database.py
- backend/app/routes/practicals.py
- backend/app/routes/ingestion.py
- backend/app/firestore_service.py

## Tasks

<task type="auto">
  <name>Add discarded_output and Document model to SQLAlchemy models and enable SQLite foreign keys</name>
  <files>
    backend/app/models.py
    backend/app/database.py
  </files>
  <action>
    1. In backend/app/models.py:
       - Add `discarded_output = Column(Text, nullable=True, default="")` to `Practical` model so instantiation with `discarded_output` succeeds.
       - Add a `Document` model representing uploaded lab manuals:
         - `id = Column(String(36), primary_key=True, default=generate_uuid)`
         - `subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True, index=True)`
         - `filename = Column(String(255), nullable=False)`
         - `file_path = Column(String(500), nullable=False)`
         - `file_size = Column(Integer, nullable=False, default=0)`
         - `parsed_practical_count = Column(Integer, default=0)`
         - `created_at = Column(DateTime, default=utc_now)`
         - Add relationship to `Subject`.
    2. In backend/app/database.py:
       - Add an engine event listener for SQLite:
         `@event.listens_for(engine, "connect")`
         `def set_sqlite_pragma(dbapi_connection, connection_record): ... cursor.execute("PRAGMA foreign_keys=ON")`
    AVOID: Omitting column defaults because existing SQLite rows may lack the column.
    USE: Explicit default="" and nullable=True for new columns.
  </action>
  <verify>
    backend\.venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'backend'); from app.models import Practical, Document; p = Practical(subject_id='s1', practical_number=1, title='t', code='c', discarded_output='out'); assert p.discarded_output == 'out'; print('MODELS_OK')"
  </verify>
  <done>
    `Practical` model instantiates cleanly with `discarded_output` without raising TypeError, and `Document` model is defined.
  </done>
</task>

<task type="auto">
  <name>Harmonize Ingestion and Practical Schemas and update batch commit</name>
  <files>
    backend/app/schemas.py
    backend/app/routes/ingestion.py
  </files>
  <action>
    1. In backend/app/schemas.py:
       - Update `IngestionCommitItem` to include `discarded_output: Optional[str] = ""`.
       - Add `DocumentOut` and `DocumentListResponse` schemas.
    2. In backend/app/routes/ingestion.py:
       - Update `commit_ingested_practicals` to safely read `item.discarded_output`.
       - Implement automatic renumbering if imported practical numbers collide with existing practical numbers in the subject.
    AVOID: Accessing attributes on Pydantic models that are not declared in the schema.
    USE: Consistent schema inheritance or explicit fields with default values.
  </action>
  <verify>
    backend\.venv\Scripts\python.exe -m pytest backend/tests/test_api.py
  </verify>
  <done>
    All API tests pass and batch commit runs without attribute or model errors on SQLite.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] `Practical` model contains `discarded_output` column.
- [ ] `Document` model is defined and recognized by SQLAlchemy metadata.
- [ ] `IngestionCommitItem` includes `discarded_output`.
- [ ] SQLite connection enforces `PRAGMA foreign_keys = ON`.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in test suite
