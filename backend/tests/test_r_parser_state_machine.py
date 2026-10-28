import re
from pathlib import Path
from docx import Document

# Boundary patterns
OUTPUT_HEADER_PAT = re.compile(
    r"^\s*(?:sample\s+|program\s+|expected\s+|terminal\s+)?(?:execution\s+)?(?:output|result|run|screen|screenshot)(?:\s+(?:output|result|screen|log|image))?\s*[:\-]?$",
    re.IGNORECASE
)

CODE_HEADER_PAT = re.compile(
    r"^\s*(?:code|source\s+code|program|implementation|(?:c|c\+\+|cpp|python|java|sql|javascript|bash|r)?\s*(?:script|code))\s*[:\-]?$",
    re.IGNORECASE
)

SUBTASK_HEADER_PAT = re.compile(
    r"^\s*#\s*([A-Za-z0-9_\-\s]+)$"
)

# R console output line patterns
R_OUTPUT_LINE_PAT = re.compile(
    r"^\s*(?:\[\d+\]|\[\d+,\s*\]|,\s*,\s*\d+|Min\.|1st Qu\.|Median|Mean|3rd Qu\.|Max\.|'data\.frame':|\$\s*[A-Za-z_]|Waiting to confirm|correlation\s*=|\d+\s+\d+\s+[A-Za-z]+)"
)

# R code line indicator
R_CODE_LINE_PAT = re.compile(
    r"^\s*(?:>|\+)\s*(.*)$"
)


def clean_r_prompt(line: str) -> str:
    """Removes leading R prompt '> ' or '+ ' or '> > ' while keeping code indentation."""
    # Matches one or more > or + prompts at the beginning of line
    cleaned = re.sub(r"^\s*(?:>\s*)+", "", line)
    if cleaned != line:
        return cleaned
    cleaned_plus = re.sub(r"^\s*\+\s*", "    ", line)
    return cleaned_plus


def parse_practical_blocks_state_machine(lines):
    clean_code_lines = []
    discarded_output_lines = []
    state = "CODE" # "CODE" or "OUTPUT"

    for line in lines:
        line_str = line.strip()
        if not line_str:
            if state == "CODE" and clean_code_lines and clean_code_lines[-1] != "":
                clean_code_lines.append("")
            continue

        # Check for Output heading
        if OUTPUT_HEADER_PAT.match(line_str):
            state = "OUTPUT"
            discarded_output_lines.append(line)
            continue

        # Check for Code heading -> switch back to CODE
        if CODE_HEADER_PAT.match(line_str):
            state = "CODE"
            continue

        # Check for Subtask comment like # scatterplot, # Boxplot, # Pie Digram
        if SUBTASK_HEADER_PAT.match(line_str):
            state = "CODE"
            clean_code_lines.append("")
            clean_code_lines.append(f"# --- {line_str.lstrip('#').strip()} ---")
            continue

        # Check for explicit R prompt: if in OUTPUT, but line starts with '> ', it's a new code block!
        m_prompt = R_CODE_LINE_PAT.match(line)
        if m_prompt:
            state = "CODE"
            code_line = clean_r_prompt(line)
            clean_code_lines.append(code_line)
            continue

        # If in CODE state, check if line is an obvious R console output line
        if state == "CODE" and R_OUTPUT_LINE_PAT.match(line_str):
            # Console output mixed in
            discarded_output_lines.append(line)
            continue

        if state == "OUTPUT":
            discarded_output_lines.append(line)
        else:
            clean_code_lines.append(clean_r_prompt(line))

    return "\n".join(clean_code_lines).strip(), "\n".join(discarded_output_lines).strip()


if __name__ == "__main__":
    from app.parser.docx_extractor import extract_raw_lines_from_docx
    from app.parser.boundary_detector import segment_document_lines

    raw_lines = extract_raw_lines_from_docx("PRACTICAL 1,2,3,4,5,6 All Practical.docx")
    segments = segment_document_lines(raw_lines)

    print(f"Total practical segments: {len(segments)}")
    for seg in segments:
        num = seg["number"]
        title = seg["title"]
        code, output = parse_practical_blocks_state_machine(seg["lines"])
        print(f"\n================ PRACTICAL {num}: {title} ================")
        print(f"Clean Code lines: {len(code.splitlines())} | Output lines: {len(output.splitlines())}")
        print("First 3 lines of code:")
        for l in code.splitlines()[:3]:
            print("  ", l)
        print("First 2 lines of output:")
        for o in output.splitlines()[:2]:
            print("  ", o)
