---
phase: 4
plan: 3
wave: 3
gap_closure: false
---

# Plan 4.3: DOCX File Storage & In-Browser Interactive Document Viewer

## Objective
Build the end-to-end functionality to upload, store, and view DOCX files directly on the website, featuring backend document persistence, high-fidelity styled HTML rendering, and a dedicated in-browser DOCX Document Viewer with reading controls, table of contents navigation, and seamless practical extraction.

## Context
Load these files for context:
- .gsd/SPEC.md
- backend/app/routes/ingestion.py
- backend/app/main.py
- frontend/src/services/api.js
- frontend/src/App.jsx
- frontend/src/components/Navbar.jsx
- frontend/src/components/PracticalList.jsx
- frontend/src/index.css

## Tasks

<task type="auto">
  <name>Create Backend Document Storage and HTML Rendering Endpoints</name>
  <files>
    backend/app/routes/documents.py
    backend/app/main.py
    backend/app/config.py
  </files>
  <action>
    1. In backend/app/config.py:
       - Define `DOCUMENTS_DIR = DATA_DIR / "uploads" / "documents"` and ensure `DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)`.
    2. Create backend/app/routes/documents.py:
       - Implement `POST /api/documents/upload`:
         - Accept uploaded `.docx` file and optional `subject_id`.
         - Persist file to `DOCUMENTS_DIR / f"{doc_id}_{filename}"`.
         - Generate high-fidelity styled HTML conversion from docx preserving headings (H1-H4), paragraphs, bold/italic formatting, tables with real borders/cells, and code blocks.
         - Save `Document` record in database (id, filename, file_path, file_size, subject_id, practical_count).
         - Return document metadata + HTML view string + parsed practicals.
       - Implement `GET /api/documents`: List uploaded documents (optionally filtered by `subject_id`).
       - Implement `GET /api/documents/{document_id}/html`: Serve styled HTML for in-browser rendering.
       - Implement `GET /api/documents/{document_id}/download`: Serve original `.docx` file download.
       - Implement `DELETE /api/documents/{document_id}`: Remove record and disk file.
    3. In backend/app/main.py:
       - Register `documents.router` in FastAPI app.
    AVOID: Unconditionally removing the uploaded file after parsing.
    USE: Persistent document storage with unique IDs and clean deletion routes.
  </action>
  <verify>
    backend\.venv\Scripts\python.exe -c "import sys; sys.path.insert(0, 'backend'); from app.routes import documents; print('DOCUMENTS_ROUTER_OK')"
  </verify>
  <done>
    Document storage and HTML rendering routes are defined and imported into FastAPI.
  </done>
</task>

<task type="auto">
  <name>Build In-Browser DOCX Document Viewer Component and Navigation on Frontend</name>
  <files>
    frontend/src/components/DocxViewerModal.jsx
    frontend/src/services/api.js
    frontend/src/App.jsx
    frontend/src/components/Navbar.jsx
    frontend/src/components/PracticalList.jsx
    frontend/src/index.css
  </files>
  <action>
    1. In frontend/src/services/api.js:
       - Add `uploadDocument`, `getDocuments`, `getDocumentHtml`, `deleteDocument`, `getDocumentDownloadUrl`.
    2. Create frontend/src/components/DocxViewerModal.jsx:
       - In-browser document reader:
         - Document header with filename, size, subject tag, zoom controls (80%, 100%, 120%, 140%), and print/download button.
         - Table of Contents sidebar for quick jumping to sections/experiments.
         - High-fidelity styled document view container (`docx-paper-container`) mimicking genuine printed paper with subtle shadows and clean typography.
         - "Extract & Import Practicals" action button that takes the parsed practicals and opens the Separation Preview modal.
    3. In frontend/src/components/Navbar.jsx and PracticalList.jsx:
       - Add a prominent **"View DOCX Manual"** / **"DOCX Documents"** button with a document icon.
       - Allow opening any previously uploaded manual or dragging & dropping a new one to view immediately.
    4. In frontend/src/App.jsx:
       - Add state `viewingDocument`, `isDocxViewerOpen`, and integrate `DocxViewerModal`.
    5. In frontend/src/index.css:
       - Add rich styles for `.docx-paper-container`, `.docx-paper-page`, `.docx-table`, `.docx-code-box`, `.docx-toc-sidebar`, and zoom controls.
  </action>
  <verify>
    cd frontend && npm run build
  </verify>
  <done>
    Frontend builds without error, and users can upload any DOCX manual and view it formatted in the browser.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] Users can upload a DOCX file and view its formatted contents (paragraphs, headings, tables, code) directly inside the website.
- [ ] Uploaded documents are persisted and listed per subject.
- [ ] Zoom and Table of Contents controls work smoothly in the viewer.
- [ ] Practicals can be extracted directly from the viewed document.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] Full end-to-end integration verified
