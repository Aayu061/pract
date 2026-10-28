# Plan 4.1 Summary: Database Model & Schema Correction

**Status:** ✅ Complete  
**Executed:** Inline mode  

## Key Accomplishments
1. **Added `discarded_output` to `Practical` Model**: Fixed fatal crash in SQLite when setting `discarded_output`.
2. **Added `Document` Model**: Persistent model for storing uploaded lab manuals and documents with relationships to subjects.
3. **Enabled SQLite Foreign Keys**: Configured connection event listener in `database.py` to enforce `PRAGMA foreign_keys = ON;`.
4. **Harmonized Ingestion Schemas**: Added `discarded_output` to `IngestionCommitItem` and added `DocumentOut` to `schemas.py`.
5. **Fixed Number Collisions & Firestore Sync**: Both SQLite and Firestore batch commits now prevent duplicate practical numbers and return newly created practicals consistently.
6. **Regression Tests**: Added `test_batch_commit_with_discarded_output_and_collision` in `test_api.py` (4/4 tests passing).
