import html
import re
from typing import Dict, Any, List
from docx import Document
from docx.text.paragraph import Paragraph
from docx.table import Table

MONOSPACE_FONTS = {"consolas", "courier new", "courier", "lucida console", "monaco", "fira code", "monospace"}


def render_docx_to_html(file_path: str) -> Dict[str, Any]:
    """
    Renders a Microsoft Word document (.docx) into rich, high-fidelity styled HTML
    for in-browser viewing, including headings, styled runs, code blocks, tables,
    and a generated Table of Contents (TOC).
    """
    doc = Document(file_path)
    html_parts: List[str] = []
    toc: List[Dict[str, Any]] = []

    h_counter = 0

    for element in doc.element.body:
        tag = element.tag.split("}")[-1] if "}" in element.tag else element.tag

        if tag == "p":
            p = Paragraph(element, doc)
            text = p.text.strip("\r\n")
            if not text:
                continue

            style_name = (p.style.name or "").lower() if p.style else ""
            is_title = "title" in style_name
            is_h1 = "heading 1" in style_name or (p.runs and p.runs[0].bold and any(k in text.lower() for k in ["practical", "experiment", "lab manual"]))
            is_h2 = "heading 2" in style_name
            is_h3 = "heading 3" in style_name or "heading 4" in style_name

            # Check if paragraph is primarily monospace code
            is_code_para = any(
                r.font.name and r.font.name.lower() in MONOSPACE_FONTS
                for r in p.runs if r.text.strip()
            )

            if is_title or is_h1 or is_h2 or is_h3:
                h_counter += 1
                heading_id = f"heading-{h_counter}"
                level = 1 if (is_title or is_h1) else (2 if is_h2 else 3)
                h_tag = f"h{level}"
                escaped_title = html.escape(text)

                toc.append({
                    "id": heading_id,
                    "title": text[:80],
                    "level": level,
                })

                html_parts.append(
                    f'<{h_tag} id="{heading_id}" class="docx-heading docx-{h_tag}">{escaped_title}</{h_tag}>'
                )
                continue

            if is_code_para:
                escaped_code = html.escape(text)
                html_parts.append(
                    f'<pre class="docx-code-block"><code>{escaped_code}</code></pre>'
                )
                continue

            # Build rich formatted paragraph from runs
            run_html_parts = []
            for r in p.runs:
                if not r.text:
                    continue
                r_text = html.escape(r.text)

                if r.font.name and r.font.name.lower() in MONOSPACE_FONTS:
                    r_text = f'<code class="docx-inline-code">{r_text}</code>'
                if r.bold:
                    r_text = f'<strong>{r_text}</strong>'
                if r.italic:
                    r_text = f'<em>{r_text}</em>'
                if r.underline:
                    r_text = f'<u>{r_text}</u>'

                run_html_parts.append(r_text)

            inner_content = "".join(run_html_parts) if run_html_parts else html.escape(text)
            html_parts.append(f'<p class="docx-paragraph">{inner_content}</p>')

        elif tag == "tbl":
            table = Table(element, doc)
            seen_cells = set()
            tbl_html = ['<div class="docx-table-wrapper"><table class="docx-table"><tbody>']

            for row_idx, row in enumerate(table.rows):
                tbl_html.append('<tr>')
                for cell in row.cells:
                    # De-duplicate merged cells in layout
                    if cell._tc in seen_cells:
                        continue
                    seen_cells.add(cell._tc)

                    cell_text = cell.text.strip()
                    escaped_cell = html.escape(cell_text).replace("\n", "<br/>")

                    tag_name = "th" if row_idx == 0 else "td"
                    tbl_html.append(f'<{tag_name} class="docx-cell">{escaped_cell}</{tag_name}>')

                tbl_html.append('</tr>')

            tbl_html.append('</tbody></table></div>')
            html_parts.append("".join(tbl_html))

    full_html = "\n".join(html_parts)
    approx_words = len(re.findall(r"\w+", full_html))

    return {
        "html": full_html,
        "toc": toc,
        "word_count": approx_words,
    }
