import re
from typing import Tuple, List, Optional

# Regex patterns that indicate transition to output/execution section
OUTPUT_BOUNDARY_PATTERNS = [
    re.compile(r"^\s*(?:sample\s+|program\s+|expected\s+|terminal\s+)?(?:execution\s+)?(?:output|result|run|screen|screenshot)(?:\s+(?:output|result|screen|log|image))?\s*[:\-]", re.IGNORECASE),
    re.compile(r"^\s*(?:output\s*screens?|screenshot\s*of\s*output)\b", re.IGNORECASE),
    re.compile(r"^\s*(?:sample\s+output|execution\s+output|program\s+output|terminal\s+output|output\s+result)\b", re.IGNORECASE),
]

# Patterns representing non-code terminal output lines
TERMINAL_INDICATORS = [
    re.compile(r"^\s*(?:>>>|\.\.\.|\$|#|C:\\[^>]+>)\s+"),
    re.compile(r"^\s*Process finished with exit code \d+", re.IGNORECASE),
    re.compile(r"^\s*\[Done\] exited with code=\d+", re.IGNORECASE),
    re.compile(r"^\s*Compilation succeeded", re.IGNORECASE),
    re.compile(r"^\s*Enter\s+(?:the\s+)?(?:number|elements?|choice|value|array)\s*:\s*\d+", re.IGNORECASE),
]

AIM_PATTERNS = [
    re.compile(r"^\s*(?:aim|objective|title|problem\s+statement|problem)\s*[:\-]\s*(.+)", re.IGNORECASE),
    re.compile(r"^\s*write\s+a\s+(?:c|cpp|c\+\+|java|python|sql|program|script)\b.+", re.IGNORECASE),
]

THEORY_PATTERNS = [
    re.compile(r"^\s*(?:theory|algorithm|flowchart|steps|procedure|description)\s*[:\-]", re.IGNORECASE),
]


def strip_line_numbering(lines: List[str]) -> List[str]:
    """
    Strips copy-pasted line numbers like '1. #include' or '01: import os' or '1) def'
    while preserving code indentation.
    """
    numbered_line_pat = re.compile(r"^\s*\d{1,4}(?:[\.\:\)]|\t)[ \t]?(.*)$")
    matches = 0
    non_empty = [l for l in lines if l.strip()]

    if not non_empty:
        return lines

    for l in non_empty:
        if numbered_line_pat.match(l):
            matches += 1

    # If more than 50% of non-empty lines have leading line numbers, strip them
    if matches / len(non_empty) >= 0.5:
        sanitized = []
        for l in lines:
            m = numbered_line_pat.match(l)
            if m:
                sanitized.append(m.group(1))
            else:
                sanitized.append(l)
        return sanitized
    return lines


def partition_code_and_output(raw_lines: List[str]) -> Tuple[List[str], List[str]]:
    """
    Splits text stream into:
    (code_lines, discarded_output_lines)
    Strictly cuts off and drops output from the code lines.
    """
    code_lines: List[str] = []
    output_lines: List[str] = []
    in_output_section = False

    for line in raw_lines:
        line_stripped = line.strip()

        # Check if line indicates start of output section
        if not in_output_section:
            for pat in OUTPUT_BOUNDARY_PATTERNS:
                if pat.search(line_stripped):
                    in_output_section = True
                    output_lines.append(line)
                    break
            if in_output_section:
                continue

        if in_output_section:
            output_lines.append(line)
        else:
            code_lines.append(line)

    return code_lines, output_lines


def extract_metadata_and_clean_code(raw_lines: List[str]) -> Tuple[str, str, str, str]:
    """
    Extracts:
    - title / aim
    - description (theory/algorithm)
    - clean_code (only pure code)
    - discarded_output (what was filtered out)
    """
    # 1. Partition into candidate code vs output
    candidate_code_lines, output_lines = partition_code_and_output(raw_lines)

    extracted_title = ""
    description_lines: List[str] = []
    final_code_lines: List[str] = []
    in_theory_section = False
    in_code_started = False

    # Heuristic: Find first Aim / Title and skip theory until code begins
    code_start_keywords = re.compile(
        r"^(?:#\s*include|import\s+|from\s+|def\s+|class\s+|public\s+class|public\s+static|<!DOCTYPE|<html|\bint\s+main\b|\bCREATE\s+TABLE|\bSELECT\b|/\*|//|#!\s*/bin)",
        re.IGNORECASE
    )

    for line in candidate_code_lines:
        line_str = line.strip()
        if not line_str:
            if in_code_started:
                final_code_lines.append(line)
            continue

        # Check for Aim / Title
        if not extracted_title:
            for pat in AIM_PATTERNS:
                m = pat.match(line_str)
                if m:
                    extracted_title = m.group(1).strip() if m.lastindex else line_str
                    break
            if extracted_title:
                continue

        # Check for Theory / Algorithm heading
        is_theory_heading = any(p.match(line_str) for p in THEORY_PATTERNS)
        if is_theory_heading:
            in_theory_section = True
            description_lines.append(line_str)
            continue

        # Check for explicit code markers (e.g. Source Code:, SQL Script:, Program:)
        if re.match(r"^\s*(?:code|source\s+code|program|implementation|(?:c|c\+\+|cpp|python|java|sql|javascript|bash)?\s*(?:script|code))\s*[:\-]?$", line_str, re.IGNORECASE):
            in_theory_section = False
            in_code_started = True
            continue

        # Check if code syntax has started
        if code_start_keywords.search(line_str):
            in_theory_section = False
            in_code_started = True

        if in_theory_section and not in_code_started:
            description_lines.append(line_str)
        else:
            in_code_started = True
            final_code_lines.append(line)

    # Clean line numbers from code lines
    final_code_lines = strip_line_numbering(final_code_lines)

    clean_code = "\n".join(final_code_lines).strip()
    clean_output = "\n".join(output_lines).strip()
    description = "\n".join(description_lines).strip()

    return extracted_title, description, clean_code, clean_output
