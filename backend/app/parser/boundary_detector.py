import re
from typing import List, Dict, Any

PRACTICAL_DELIMITER_PATTERNS = [
    # Practical 1 / Practical No. 1 / Practical - 1: Aim
    re.compile(r"^\s*(?:practical|experiment|lab\s+assignment|program|assignment|exercise|problem)\s*(?:no\.?|number|#)?\s*[-:\.]?\s*([0-9]+|[ivxlcdm]+)\b(?:\s*[-:\.]\s*(.*))?", re.IGNORECASE),
    # Exp 1 / Pract 1
    re.compile(r"^\s*(?:exp|pract)\.?\s*[-:\.]?\s*([0-9]+)\b(?:\s*[-:\.]\s*(.*))?", re.IGNORECASE),
    # Q1. / Question 1:
    re.compile(r"^\s*(?:q|question)\.?\s*([0-9]+)\s*[:\.]\s*(.*)", re.IGNORECASE),
    # 1. Aim: ... or 1. Write a program to ...
    re.compile(r"^\s*(\d{1,2})\.\s+(?:aim\s*[:\-]|write\s+a\s+|to\s+implement\s+|program\s+to\s+)(.*)", re.IGNORECASE),
]

ROMAN_MAP = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10, "xi": 11, "xii": 12, "xiii": 13, "xiv": 14, "xv": 15}


def parse_number(num_str: str, default_num: int) -> int:
    num_clean = num_str.strip().lower()
    if num_clean.isdigit():
        return int(num_clean)
    if num_clean in ROMAN_MAP:
        return ROMAN_MAP[num_clean]
    return default_num


def segment_document_lines(raw_lines: List[str]) -> List[Dict[str, Any]]:
    """
    Scans sequential lines and partitions them into separate practical blocks.
    Ignores cover page/preamble before the first practical delimiter.
    """
    segments: List[Dict[str, Any]] = []
    current_block: List[str] = []
    current_num = 1
    current_title = ""
    first_delimiter_seen = False
    preamble_lines: List[str] = []

    for line in raw_lines:
        line_clean = line.strip()
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
                current_block.append(line)
            else:
                preamble_lines.append(line)

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
