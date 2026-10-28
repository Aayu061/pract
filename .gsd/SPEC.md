# SPEC.md — Project Specification

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: Planning unlocked. Specification approved by user.

## Vision
A modern, user-friendly portal for Computer Science students and faculty to manage, view, copy, edit, and export practical experiment codes organized by subject. The platform incorporates a smart multi-practical DOCX separation engine that automatically parses lab manuals, decomposes them into individual practicals, extracts pure source code, and strictly eliminates execution outputs and terminal logs.

## Goals
1. **Intelligent DOCX Parsing & Code Separation**: Automatically parse uploaded multi-experiment `.docx` files, identify practical boundaries, isolate aims, extract clean code, and strictly filter out console outputs, sample runs, and screenshots.
2. **Interactive Preview & Verification**: Provide a side-by-side verification preview showing extracted code vs discarded output with confidence metrics before saving to the database.
3. **Interactive Code Hub**: Allow instant one-click code copying to clipboard with visual toast alerts, and in-browser live code editing with persistent database updates.
4. **Subject & Practical Management**: Support manual addition, updating, searching, filtering by subject/language/keywords, and single or batch ZIP/code export.
5. **Modern, Responsive UI/UX**: Provide an interactive user experience with sleek dark/light mode, glassmorphism, responsive navigation, and syntax highlighting.

## Non-Goals (Out of Scope)
- Cloud-based code execution sandbox / online compiler (code execution is left to local IDEs or future scope).
- User authentication/multi-tenant roles (kept lightweight and accessible for local/intranet use; can be added in later milestones).

## Constraints
- Python 3.13 backend with FastAPI, SQLite, and `python-docx`.
- React (Vite) frontend with modern Vanilla CSS design system.
- Zero external database installation required (uses local SQLite).

## Success Criteria
- [x] User approval on architecture and design.
- [ ] Backend API endpoints for subjects, practicals, and ingestion functional.
- [ ] Smart DOCX parser successfully extracts code while filtering out outputs with >90% precision.
- [ ] Interactive preview modal allows review and edit before import.
- [ ] Live code editing and instant clipboard copying working flawlessly.
- [ ] Automated tests passing for parser and API endpoints.

---
*Last updated: 2026-10-28*
