import os
from typing import List, Dict, Any
from docx import Document
from .boundary_detector import segment_document_lines
from .code_sanitizer import extract_metadata_and_clean_code
from .language_detector import detect_language


from docx.text.paragraph import Paragraph
from docx.table import Table


def extract_raw_lines_from_docx(file_path: str) -> List[str]:
    """
    Reads paragraphs and tables from .docx preserving sequential order.
    Uses docx Paragraph/Table wrappers to avoid duplicate text from mc:AlternateContent.
    """
    doc = Document(file_path)
    raw_lines: List[str] = []

    for element in doc.element.body:
        tag = element.tag.split("}")[-1] if "}" in element.tag else element.tag

        if tag == "p":
            p = Paragraph(element, doc)
            text = p.text.strip("\r\n")
            if text:
                raw_lines.append(text)
            else:
                if raw_lines and raw_lines[-1] != "":
                    raw_lines.append("")

        elif tag == "tbl":
            table = Table(element, doc)
            for row in table.rows:
                cell_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if cell_texts:
                    raw_lines.append("\n".join(cell_texts))

    return raw_lines


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
    1. Read .docx sequential lines
    2. Segment into discrete practical blocks
    3. Separate Aim, Theory, Code, and Output
    4. Detect programming language
    5. Return parsed preview objects
    """
    raw_lines = extract_raw_lines_from_docx(file_path)
    segments = segment_document_lines(raw_lines)

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
