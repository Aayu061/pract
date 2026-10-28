import re
from typing import Tuple, List, Optional, Any


# Regex patterns that indicate transition to output/execution section
OUTPUT_BOUNDARY_PATTERNS = [
    re.compile(r"^\s*(?:sample\s+|program\s+|expected\s+|terminal\s+)?(?:execution\s+)?(?:output|result|run|screen|screenshot)(?:\s+(?:output|result|screen|log|image))?\s*[:\-]?$", re.IGNORECASE),
    re.compile(r"^\s*(?:output\s*screens?|screenshot\s*of\s*output)\b", re.IGNORECASE),
    re.compile(r"^\s*(?:sample\s+output|execution\s+output|program\s+output|terminal\s+output|output\s+result)\b", re.IGNORECASE),
]

# Patterns that indicate a return to CODE from OUTPUT (interleaved sub-experiments)
CODE_BOUNDARY_PATTERNS = [
    re.compile(r"^\s*(?:code|source\s+code|program|implementation|(?:c|c\+\+|cpp|python|java|sql|javascript|bash|r)?\s*(?:script|code))\s*[:\-]?$", re.IGNORECASE),
]

# Subtask headings inside a practical, e.g. '# Line Graph', '# scatterplot', '# Boxplot', '# 1. Bubble Sort'
SUBTASK_HEADER_PATTERN = re.compile(
    r"^\s*#+\s*([A-Za-z0-9_\-\s\(\)\:\.]+)\s*$"
)

# Common REPL prompt lines indicating active code
REPL_PROMPT_PATTERNS = [
    re.compile(r"^\s*(?:>|\+)\s*(.*)$"),           # R console prompt
    re.compile(r"^\s*(?:>>>|\.\.\.)\s+(.*)$"),      # Python REPL prompt
]

# Obvious terminal / console output lines
CONSOLE_OUTPUT_PATTERNS = [
    re.compile(r"^\s*\[\d+\]\s+"),                                  # R vector output: [1] "Payal"
    re.compile(r"^\s*\[\d+,\s*\]"),                                 # R matrix output: [1,] 1 3
    re.compile(r"^\s*,\s*,\s*\d+"),                                 # R array slice: , , 1
    re.compile(r"^\s*(?:Min\.|1st Qu\.|Median|Mean|3rd Qu\.|Max\.)\s*:"), # R summary
    re.compile(r"^\s*'data\.frame':\s+\d+\s+obs"),                  # R str() output
    re.compile(r"^\s*\$\s*[A-Za-z_]\w*\s*:"),                       # R list/dataframe member output
    re.compile(r"^\s*(?:Waiting to confirm page change\.\.\.|Process finished with exit code \d+|\[Done\] exited with code=\d+)"),
    re.compile(r"^\s*correlation\s*=\s*[\d\.\-]+"),
]

AIM_PATTERNS = [
    re.compile(r"^\s*(?:aim|objective|title|problem\s+statement|problem)\s*[:\-]\s*(.+)", re.IGNORECASE),
    re.compile(r"^\s*write\s+a\s+(?:c|cpp|c\+\+|java|python|sql|r|program|script)\b.+", re.IGNORECASE),
]

THEORY_PATTERNS = [
    re.compile(r"^\s*(?:theory|algorithm|flowchart|steps|procedure|description)\s*[:\-]", re.IGNORECASE),
]

STRONG_CODE_KEYWORDS = re.compile(
    r"^(?:#\s*include|import\s+[A-Za-z0-9_\.]+|from\s+[A-Za-z0-9_\.]+\s+import|def\s+[A-Za-z_]\w*\s*\(|\bclass\s+[A-Za-z_]\w*(?:\s*\(|\s*\{|\s*:)|public\s+class\b|public\s+static\b|<!DOCTYPE|<html|\bint\s+main\b|\bCREATE\s+TABLE\b|\bSELECT\s+.+\s+FROM\b|/\*|//|#!\s*/bin|\bplot\s*\(|\bbarplot\s*\(|\bdata\.frame\s*\(|\blibrary\s*\()",
    re.IGNORECASE
)


def normalize_typographic_quotes(text: str) -> str:
    """
    Normalizes Microsoft Word smart/curly quotes into standard ASCII quotes
    so code compiles cleanly.
    """
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("‘", "'").replace("’", "'")
    text = text.replace("`", "'")
    return text


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


def clean_repl_prompt(line: str) -> str:
    """
    Strips leading REPL prompt artifacts (like R '>' or '+', Python '>>>')
    while preserving clean indentation.
    """
    # Leading R prompt: '> ', '> > ', '> '
    cleaned = re.sub(r"^\s*(?:>\s*)+", "", line)
    if cleaned != line:
        return cleaned

    # R continuation prompt: '+ ' -> replace with 4 spaces indent
    m_plus = re.match(r"^\s*\+\s*(.*)$", line)
    if m_plus:
        return "    " + m_plus.group(1)

    # Python prompt: '>>> '
    cleaned_py = re.sub(r"^\s*>>>\s*", "", line)
    if cleaned_py != line:
        return cleaned_py

    # Python continuation: '... '
    cleaned_dots = re.sub(r"^\s*\.\.\.\s*", "    ", line)
    if cleaned_dots != line:
        return cleaned_dots

    return line


def extract_metadata_and_clean_code(raw_lines: List[Any]) -> Tuple[str, str, str, str]:
    """
    Enhanced Multi-Cycle State-Machine Parser:
    Seamlessly parses practicals with multiple interleaved sub-experiments:
    [Subtask 1: Code -> Output] -> [Subtask 2: Code -> Output] -> [Subtask 3: Code -> Output]

    Supports both plain string lines and AST element dicts with monospace & typography metadata.

    Returns:
    - title / aim
    - description (theory/objective notes)
    - clean_code (all clean code blocks aggregated across subtasks)
    - discarded_output (all segregated output blocks, tables, and console dumps)
    """
    extracted_title = ""
    description_lines: List[str] = []
    clean_code_lines: List[str] = []
    discarded_output_lines: List[str] = []

    # States: 'PREAMBLE', 'CODE', 'OUTPUT'
    state = "PREAMBLE"

    for item in raw_lines:
        if isinstance(item, dict):
            raw_text = item.get("text", "")
            is_monospace = item.get("is_monospace", False)
            is_callout = item.get("is_callout_box", False)
        else:
            raw_text = str(item)
            is_monospace = False
            is_callout = False

        # Normalize typographic smart quotes
        line = normalize_typographic_quotes(raw_text)
        line_str = line.strip()

        # Handle blank lines
        if not line_str:
            if state == "CODE" and clean_code_lines and clean_code_lines[-1] != "":
                clean_code_lines.append("")
            elif state == "OUTPUT" and discarded_output_lines and discarded_output_lines[-1] != "":
                discarded_output_lines.append("")
            continue

        # Monospace font run or callout table immediately identifies active code block
        if is_monospace or is_callout:
            state = "CODE"
            clean_code_lines.append(clean_repl_prompt(line))
            continue


        # 1. Aim / Title Detection (if in PREAMBLE or if not yet set)
        if not extracted_title:
            for pat in AIM_PATTERNS:
                m = pat.match(line_str)
                if m:
                    extracted_title = m.group(1).strip() if m.lastindex else line_str
                    break
            if extracted_title:
                continue

        # 2. Theory / Algorithm header detection
        is_theory_heading = any(p.match(line_str) for p in THEORY_PATTERNS)
        if is_theory_heading:
            description_lines.append(line_str)
            continue

        # 3. Explicit OUTPUT Marker Transition
        is_output_marker = any(p.match(line_str) for p in OUTPUT_BOUNDARY_PATTERNS)
        if is_output_marker:
            state = "OUTPUT"
            discarded_output_lines.append(line)
            continue

        # 4. Explicit CODE Marker Transition (e.g. 'Code:', 'Source Code:')
        is_code_marker = any(p.match(line_str) for p in CODE_BOUNDARY_PATTERNS)
        if is_code_marker:
            state = "CODE"
            continue

        # 5. Sub-Task / Experiment Section Transition (e.g. '# Line Graph', '# scatterplot', '# Boxplot')
        subtask_match = SUBTASK_HEADER_PATTERN.match(line_str)
        if subtask_match:
            state = "CODE"
            subtask_name = subtask_match.group(1).strip()
            if clean_code_lines and clean_code_lines[-1] != "":
                clean_code_lines.append("")
            clean_code_lines.append(f"# --- {subtask_name} ---")
            continue

        # 6. Check for REPL Prompt or Strong Code Keywords (Transitions from OUTPUT back to CODE)
        has_repl_prompt = any(p.match(line) for p in REPL_PROMPT_PATTERNS)
        has_strong_code = STRONG_CODE_KEYWORDS.search(line_str) is not None

        if state == "OUTPUT" and (has_repl_prompt or has_strong_code):
            state = "CODE"

        # 7. In PREAMBLE: if we see code or prompts, switch to CODE
        if state == "PREAMBLE":
            if has_repl_prompt or has_strong_code:
                state = "CODE"
            else:
                # Capture initial title if line is not aim
                if not extracted_title and len(line_str) > 3 and not line_str.startswith("#"):
                    extracted_title = line_str
                    continue
                description_lines.append(line_str)
                continue

        # 8. Filter console output patterns even if mixed into CODE state
        if state == "CODE":
            is_console_out = any(p.search(line_str) for p in CONSOLE_OUTPUT_PATTERNS)
            if is_console_out:
                discarded_output_lines.append(line)
                continue

        # 9. Route according to active state
        if state == "OUTPUT":
            discarded_output_lines.append(line)
        else:
            # Clean REPL prompt artifacts (like '> ', '+ ')
            clean_line = clean_repl_prompt(line)
            clean_code_lines.append(clean_line)

    # Clean line numbers from copy-pasted blocks
    clean_code_lines = strip_line_numbering(clean_code_lines)

    clean_code = "\n".join(clean_code_lines).strip()
    clean_output = "\n".join(discarded_output_lines).strip()
    description = "\n".join(description_lines).strip()

    return extracted_title, description, clean_code, clean_output


def partition_code_and_output(raw_lines: List[str]) -> Tuple[List[str], List[str]]:
    """
    Convenience wrapper for partitioning raw lines into code lines and output lines.
    """
    _, _, clean_code, clean_output = extract_metadata_and_clean_code(raw_lines)
    code_lines = clean_code.splitlines() if clean_code else []
    output_lines = clean_output.splitlines() if clean_output else []
    return code_lines, output_lines
