import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.parser.docx_extractor import parse_docx_file

if __name__ == "__main__":
    file_path = "PRACTICAL 1,2,3,4,5,6 All Practical.docx"
    res = parse_docx_file(file_path)
    print(f"Total practicals extracted: {res['total_practicals_found']}")
    print("=" * 60)
    for p in res["practicals"]:
        code_lines = p["code"].splitlines()
        out_lines = p["discarded_output"].splitlines()
        print(f"Practical #{p['practical_number']}: '{p['title'][:60]}'")
        print(f"  Detected Language: {p['language'].upper()} ({p['confidence']}% match)")
        print(f"  Clean Code lines : {len(code_lines)}")
        print(f"  Filtered Output  : {len(out_lines)} lines")
        print("  Snippet of clean code:")
        for l in code_lines[:4]:
            print(f"    {l}")
        print("-" * 60)
