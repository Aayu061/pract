import re
from typing import List, Dict, Any, Union

PRACTICAL_DELIMITER_PATTERNS = [
    # Practical 1 / Practical No. 1 / Practical - 1: Aim / Experiment 1
    re.compile(r"^\s*(?:practical|experiment|lab\s+assignment|program|assignment|exercise|problem|task|case\s+study|activity|session|week)\s*(?:no\.?|number|#)?\s*[-:\.]?\s*([0-9]+(?:\.[0-9]+)?|[ivxlcdm]+)\b(?:\s*[-:\.]\s*(.*))?", re.IGNORECASE),
    # Exp 1 / Pract 1 / Lab 1 / Lab-01
    re.compile(r"^\s*(?:exp|pract|lab)\.?\s*[-:\.]?\s*([0-9]+(?:\.[0-9]+)?)\b(?:\s*[-:\.]\s*(.*))?", re.IGNORECASE),
    # Q1. / Question 1:
    re.compile(r"^\s*(?:q|question)\.?\s*([0-9]+)\s*[:\.]\s*(.*)", re.IGNORECASE),
    # 1. Aim: ... or 1. Write a program to ...
    re.compile(r"^\s*(\d{1,2})\.\s+(?:aim\s*[:\-]|write\s+a\s+|to\s+implement\s+|program\s+to\s+)(.*)", re.IGNORECASE),
]

ROMAN_MAP = {
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10,
    "xi": 11, "xii": 12, "xiii": 13, "xiv": 14, "xv": 15, "xvi": 16, "xvii": 17, "xviii": 18, "xix": 19, "xx": 20
}


def parse_number(num_str: str, default_num: int) -> int:
    num_clean = num_str.strip().lower()
    if num_clean.isdigit():
        return int(num_clean)
    if "." in num_clean:
        parts = num_clean.split(".")
        if parts[0].isdigit():
            return int(parts[0])
    if num_clean in ROMAN_MAP:
        return ROMAN_MAP[num_clean]
    return default_num


def get_element_text(item: Union[str, Dict[str, Any]]) -> str:
    if isinstance(item, dict):
        return item.get("text", "")
    return str(item)


def segment_document_lines(raw_lines: List[Union[str, Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    Scans sequential lines or AST elements and partitions them into separate practical blocks.
    Supports both plain strings and rich AST element dicts.
    Ignores cover page/preamble before the first practical delimiter.
    """
    segments: List[Dict[str, Any]] = []
    current_block: List[Union[str, Dict[str, Any]]] = []
    current_num = 1
    current_title = ""
    first_delimiter_seen = False
    preamble_lines: List[Union[str, Dict[str, Any]]] = []

    for item in raw_lines:
        line_clean = get_element_text(item).strip()
        matched_delimiter = False
        parsed_num = None
        trailing_title = ""

        # Check if line matches a practical delimiter pattern
        for pat in PRACTICAL_DELIMITER_PATTERNS:
            m = pat.match(line_clean)
            if m:
                matched_delimiter = True
                parsed_num = parse_number(m.group(1), len(segments) + 1)
                if len(m.groups()) >= 2 and m.group(2):
                    trailing_title = m.group(2).strip()
                break

        # Check AST metadata if available (Word Heading 1 or Title style containing practical)
        if not matched_delimiter and isinstance(item, dict):
            is_heading = item.get("is_heading", False) or item.get("heading_level", 0) in (1, 2)
            if is_heading and any(k in line_clean.lower() for k in ["practical", "experiment", "lab", "task"]):
                matched_delimiter = True
                parsed_num = len(segments) + 1
                trailing_title = line_clean

        if matched_delimiter:
            if first_delimiter_seen:
                # Save previous practical block
                if current_block:
                    segments.append({
                        "number": current_num,
                        "title": current_title,
                        "lines": current_block,
                    })
            else:
                first_delimiter_seen = True

            current_num = parsed_num or (len(segments) + 1)
            current_title = trailing_title
            current_block = []
        else:
            if first_delimiter_seen:
                current_block.append(item)
            else:
                preamble_lines.append(item)

    # Append final block
    if first_delimiter_seen and current_block:
        segments.append({
            "number": current_num,
            "title": current_title,
            "lines": current_block,
        })

    # Fallback: if no delimiter matched anywhere in document, treat whole document as Practical 1
    if not first_delimiter_seen and preamble_lines:
        segments.append({
            "number": 1,
            "title": "",
            "lines": preamble_lines,
        })

    return segments

