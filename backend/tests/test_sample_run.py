import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.parser.docx_extractor import parse_docx_file

if __name__ == "__main__":
    res = parse_docx_file("sample_cs_lab_manual.docx")
    print(f"Total practicals found: {res['total_practicals_found']}")
    for p in res["practicals"]:
        print(f"-> Practical {p['practical_number']}: '{p['title']}'")
        print(f"   Detected Language: {p['language']} (confidence: {p['confidence']}%)")
        print(f"   Code length: {len(p['code'])} chars")
        print(f"   Discarded Output stripped: {len(p['discarded_output'])} chars")
        print(f"   Sample clean code snippet:\n   {p['code'].splitlines()[0] if p['code'] else 'EMPTY'}")
        print("-" * 50)
