---
milestone: MVP
version: 1.0.0
updated: 2026-10-28T07:49:00+05:30
---

# Roadmap

> **Current Phase:** Phase 4 - Audit Fixes, Real-World Parser Algorithm & In-Browser DOCX Viewer
> **Status:** planned

## Must-Haves (from SPEC)
- [ ] Backend FastAPI application with SQLite database
- [ ] Smart DOCX multi-practical parsing algorithm with output elimination
- [ ] Interactive Preview & Verification endpoint
- [ ] React (Vite) frontend with rich modern UI and theme toggle
- [ ] Interactive Code Viewer, One-Click Copy, and Live In-Place Editor
- [ ] Automated tests verifying code extraction and output filtering

---

## Phases

### Phase 1: Backend Architecture & Smart DOCX Parser Engine
**Status:** ✅ Complete
**Objective:** Deliver FastAPI API, SQLite models, and the 5-stage DOCX parsing & output elimination algorithm with test suite.

**Plans:**
- [x] Plan 1.1: Database models, schemas, and CRUD routes (Subjects, Practicals)
- [x] Plan 1.2: DOCX boundary detector, output eliminator, syntax cleanser, and preview/commit ingestion pipeline
- [x] Plan 1.3: Automated test suite for parser and API

---

### Phase 2: Frontend Portal & Interactive User Interface
**Status:** ✅ Complete
**Objective:** Build modern, responsive React + Vite application with custom Vanilla CSS design system, code editor, preview modal, and instant copy.

**Plans:**
- [x] Plan 2.1: Vite setup, design tokens, theme engine, Navbar, and Subject sidebar
- [x] Plan 2.2: Practical list, code viewer, one-click copy, and live code editor modal
- [x] Plan 2.3: Drag-and-drop DOCX upload with interactive Separation Preview & Verification modal

---

### Phase 3: Integration, Polish & Verification
**Status:** ✅ Complete
**Objective:** End-to-end integration testing with sample lab manuals, export features (ZIP/code), and walkthrough documentation.

---

### Phase 4: Audit Fixes, Real-World Parser Algorithm & In-Browser DOCX Viewer
**Status:** ⏳ Planned
**Objective:** Resolve critical database model and schema defects, implement a multi-pass AST-driven lab manual parsing algorithm, and build an in-browser DOCX document viewing engine.

**Plans:**
- [ ] Plan 4.1: Database Model & Schema Correction (discarded_output fix, Document model, foreign keys)
- [ ] Plan 4.2: Real-World AST-Driven DOCX Parser & Multi-Classifier Engine (Monospace, quote normalization, table de-duplication)
- [ ] Plan 4.3: DOCX File Storage & In-Browser Interactive Document Viewer (Backend persistence & HTML render API, React DOCX Viewer Modal)

