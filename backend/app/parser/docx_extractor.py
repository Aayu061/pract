import os
from typing import List, Dict, Any
from docx import Document
from .boundary_detector import segment_document_lines
from .code_sanitizer import extract_metadata_and_clean_code
from .language_detector import detect_language


from docx.text.paragraph import Paragraph
from docx.table import Table


def extract_document_elements(file_path: str) -> List[Dict[str, Any]]:
    """
    Reads paragraphs and tables from .docx preserving sequential order and capturing AST metadata:
    - Text content
    - Style name (Heading 1, Heading 2, Title, Normal)
    - Heading level
    - Bold and italic run flags
    - Monospace font detection (Consolas, Courier New, Lucida Console, Monaco, Fira Code)
    - De-duplicated table cells (accounting for gridSpan and vMerge via seen XML _tc elements)
    - Single-cell callout box detection
    """
    doc = Document(file_path)
    elements: List[Dict[str, Any]] = []

    MONOSPACE_FONTS = {"consolas", "courier new", "courier", "lucida console", "monaco", "fira code", "monospace"}

    for element in doc.element.body:
        tag = element.tag.split("}")[-1] if "}" in element.tag else element.tag

        if tag == "p":
            p = Paragraph(element, doc)
            text = p.text.strip("\r\n")
            if not text:
                if elements and elements[-1].get("text") != "":
                    elements.append({"text": "", "is_blank": True})
                continue

            style_name = (p.style.name or "").lower() if p.style else ""
            is_heading = "heading" in style_name or "title" in style_name
            heading_level = 0
            if "heading 1" in style_name:
                heading_level = 1
            elif "heading 2" in style_name:
                heading_level = 2
            elif "heading 3" in style_name:
                heading_level = 3

            # Run inspection
            is_bold = any(bool(r.bold) for r in p.runs if r.text.strip())
            is_monospace = any(
                r.font.name and r.font.name.lower() in MONOSPACE_FONTS
                for r in p.runs if r.text.strip()
            )
            font_size = 0.0
            for r in p.runs:
                if r.font.size:
                    try:
                        font_size = max(font_size, r.font.size.pt)
                    except Exception:
                        pass

            elements.append({
                "text": text,
                "is_heading": is_heading,
                "heading_level": heading_level,
                "is_bold": is_bold,
                "is_monospace": is_monospace,
                "font_size_pt": font_size,
                "is_table": False,
            })

        elif tag == "tbl":
            table = Table(element, doc)
            seen_cells = set()
            is_single_cell = len(table.rows) == 1 and len(table.columns) == 1

            for row in table.rows:
                row_texts = []
                for cell in row.cells:
                    # De-duplicate merged cells (gridSpan / vMerge)
                    if cell._tc in seen_cells:
                        continue
                    seen_cells.add(cell._tc)

                    cell_text = cell.text.strip()
                    if cell_text:
                        row_texts.append(cell_text)

                if row_texts:
                    elements.append({
                        "text": "\n".join(row_texts),
                        "is_heading": False,
                        "heading_level": 0,
                        "is_bold": False,
                        "is_monospace": False,
                        "is_table": True,
                        "is_callout_box": is_single_cell,
                    })

    return elements


def extract_raw_lines_from_docx(file_path: str) -> List[str]:
    """
    Reads paragraphs and tables from .docx preserving sequential order.
    Uses extract_document_elements to avoid duplicate text from merged table cells.
    """
    elements = extract_document_elements(file_path)
    return [e["text"] for e in elements]



def calculate_confidence(title: str, code: str, language: str, has_output_filtered: bool) -> int:
    """
    Computes a 0-100 score indicating extraction accuracy.
    """
    score = 40
    if title and len(title) > 5:
        score += 20
    if code and len(code) > 20:
        score += 20
    if language != "text":
        score += 10
    if has_output_filtered:
        score += 10
    return min(98, score)


def parse_docx_file(file_path: str) -> Dict[str, Any]:
    """
    Full extraction pipeline:
    1. Read .docx sequential AST elements with font and table metadata
    2. Segment into discrete practical blocks
    3. Separate Aim, Theory, Code, and Output
    4. Detect programming language
    5. Return parsed preview objects
    """
    doc_elements = extract_document_elements(file_path)
    segments = segment_document_lines(doc_elements)

    parsed_practicals: List[Dict[str, Any]] = []
    warnings: List[str] = []


    for index, seg in enumerate(segments, start=1):
        num = seg.get("number", index)
        lines = seg.get("lines", [])
        initial_title = seg.get("title", "")

        extracted_title, description, clean_code, discarded_output = extract_metadata_and_clean_code(lines)

        final_title = initial_title or extracted_title or f"Practical {num}"

        # Detect language on clean code
        language, lang_conf = detect_language(clean_code)

        conf = calculate_confidence(final_title, clean_code, language, bool(discarded_output))

        if not clean_code:
            warnings.append(f"Practical {num} has no detectable code block.")

        parsed_practicals.append({
            "practical_number": num,
            "title": final_title,
            "description": description,
            "language": language,
            "code": clean_code,
            "discarded_output": discarded_output,
            "confidence": conf,
            "include": bool(clean_code),
        })

    return {
        "filename": os.path.basename(file_path),
        "total_practicals_found": len(parsed_practicals),
        "practicals": parsed_practicals,
        "warnings": warnings,
    }
