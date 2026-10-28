---
phase: 4
plan: 2
wave: 2
gap_closure: false
---

# Plan 4.2: Real-World AST-Driven DOCX Parser & Multi-Classifier Engine

## Objective
Implement an advanced, multi-pass parsing and classification engine in Python that extracts clean source code and preserved expected outputs from messy, real-world academic lab manuals by analyzing document styles, run-level font typography (monospace), de-duplicating merged table cells, normalizing smart quotes, and employing contextual lookahead classification.

## Context
Load these files for context:
- .gsd/SPEC.md
- backend/app/parser/docx_extractor.py
- backend/app/parser/boundary_detector.py
- backend/app/parser/code_sanitizer.py
- backend/app/parser/language_detector.py

## Tasks

<task type="auto">
  <name>Build AST-Aware Document Element Extractor and Table Matrix Resolver</name>
  <files>
    backend/app/parser/docx_extractor.py
    backend/app/parser/boundary_detector.py
  </files>
  <action>
    1. In backend/app/parser/docx_extractor.py:
       - Refactor extraction into an AST-aware parser that captures paragraph metadata:
         - Text, style name (`p.style.name`), heading level.
         - Run-level analysis: bold flag, font size (pt), and monospace font detection (`is_monospace = any(font in ['consolas', 'courier new', 'lucida console', 'monaco', 'fira code', 'monospace'] for font in run_fonts)`).
       - For tables: resolve merged cells (gridSpan/vMerge) using a visited cell coordinates set so identical merged cells are never duplicated.
       - Detect single-cell shaded callout tables and tag them as dedicated code blocks.
    2. In backend/app/parser/boundary_detector.py:
       - Implement weighted multi-signal boundary detection:
         - Signal A: Word heading style (`Heading 1`, `Heading 2`, `Title`) (+50).
         - Signal B: Keyword regex (`Practical`, `Experiment`, `Lab`, `Task`, `Problem`, `Case Study`, `Exercise`, `Week`, `Session`) (+40).
         - Signal C: Large bold font size ($\ge 14\text{pt}$) (+25).
       - Support Roman numerals, dotted sub-numbering (`1.1`, `2.3`), and letter suffixes (`1A`, `1B`).
    AVOID: Naively iterating over `table.rows` without tracking merged cell XML ids (`cell._tc`).
    USE: Set of cell IDs to guarantee zero duplicate lines from merged cells.
  </action>
  <verify>
    backend\.venv\Scripts\python.exe backend/tests/test_user_r_docx.py
  </verify>
  <done>
    `PRACTICAL 1,2,3,4,5,6 All Practical.docx` and sample lab manuals are parsed without duplicate table cell lines and with accurate boundary detection.
  </done>
</task>

<task type="auto">
  <name>Upgrade Code Sanitizer with Quote Normalization and Contextual Output Lookahead</name>
  <files>
    backend/app/parser/code_sanitizer.py
    backend/app/parser/language_detector.py
    backend/tests/test_parser.py
  </files>
  <action>
    1. In backend/app/parser/code_sanitizer.py:
       - Add typographic quote normalizer:
         - Replace smart double quotes `“` and `”` with standard `"`.
         - Replace smart single quotes `‘` and `’` and backticks with `'`.
       - Enhance lookahead in state machine to prevent output containing code snippets (like R parameter lines or python dict prints) from leaking back into the CODE state.
       - Tighten `STRONG_CODE_KEYWORDS` so broad words like `class ` or `SELECT ` in normal English sentences do not prematurely trigger code mode unless followed by programming syntax.
       - Preserve structured `expected_output` alongside `clean_code` so output is available for display instead of being lost.
    2. In backend/tests/test_parser.py:
       - Add unit tests verifying smart quote normalization, table de-duplication, and complex output lookahead.
  </action>
  <verify>
    backend\.venv\Scripts\python.exe -m pytest backend/tests/test_parser.py
  </verify>
  <done>
    All parser unit tests pass with 100% precision on quote normalization and output segregation.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] Smart typographic quotes (`“`, `”`) are converted to standard ASCII quotes.
- [ ] Merged table cells in DOCX files produce exactly one entry rather than duplicated text.
- [ ] Parser retains both clean code and formatted expected output.
- [ ] No regression on existing 6-practical R manual test.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] Pytest parser suite passing
