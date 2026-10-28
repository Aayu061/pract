import re
from typing import Dict, Tuple

LANGUAGE_SIGNATURES: Dict[str, list[re.Pattern]] = {
    "cpp": [
        re.compile(r"#\s*include\s*<[a-zA-Z0-9_\.]+>"),
        re.compile(r"\busing\s+namespace\s+std;"),
        re.compile(r"\bcout\s*<<"),
        re.compile(r"\bcin\s*>>"),
        re.compile(r"\bstd::[a-zA-Z_]+"),
        re.compile(r"\bint\s+main\s*\([^)]*\)"),
        re.compile(r"\b(?:template\s*<|class\s+\w+\s*\{|nullptr)"),
        re.compile(r"\b(?:vector|string|stack|queue|map)\s*<"),
    ],
    "c": [
        re.compile(r"#\s*include\s*<stdio\.h>"),
        re.compile(r"#\s*include\s*<stdlib\.h>"),
        re.compile(r"\bprintf\s*\("),
        re.compile(r"\bscanf\s*\("),
        re.compile(r"\bmalloc\s*\("),
        re.compile(r"\bstruct\s+[A-Za-z_]\w*\s*\*"),
        re.compile(r"\bint\s+main\s*\([^)]*\)"),
    ],
    "python": [
        re.compile(r"^\s*def\s+[a-zA-Z_]\w*\s*\(", re.MULTILINE),
        re.compile(r"^\s*(?:import\s+[a-zA-Z0-9_\.]+|from\s+[a-zA-Z0-9_\.]+\s+import)", re.MULTILINE),
        re.compile(r"\bprint\s*\([^)]*\)"),
        re.compile(r"^\s*class\s+[a-zA-Z_]\w*(?:\([^)]*\))?:", re.MULTILINE),
        re.compile(r"if\s+__name__\s*==\s*['\"]__main__['\"]\s*:"),
        re.compile(r"\belif\s+"),
        re.compile(r"\b(?:self\.|len\(|range\(|enumerate\(|append\()"),
    ],
    "java": [
        re.compile(r"\bpublic\s+class\s+[a-zA-Z_]\w*"),
        re.compile(r"\bpublic\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w+\s*\)"),
        re.compile(r"\bSystem\.(?:out|err)\.print"),
        re.compile(r"\bimport\s+java\.[a-zA-Z0-9_\.]+;"),
        re.compile(r"\bScanner\s+\w+\s*=\s*new\s+Scanner"),
        re.compile(r"\bnew\s+[A-Z]\w*\("),
    ],
    "sql": [
        re.compile(r"\bCREATE\s+TABLE\b", re.IGNORECASE),
        re.compile(r"\bSELECT\s+.+\s+FROM\b", re.IGNORECASE),
        re.compile(r"\bINSERT\s+INTO\b", re.IGNORECASE),
        re.compile(r"\bUPDATE\s+.+\s+SET\b", re.IGNORECASE),
        re.compile(r"\bDELETE\s+FROM\b", re.IGNORECASE),
        re.compile(r"\bPRIMARY\s+KEY\b", re.IGNORECASE),
        re.compile(r"\bGROUP\s+BY\b", re.IGNORECASE),
        re.compile(r"\bORDER\s+BY\b", re.IGNORECASE),
    ],
    "javascript": [
        re.compile(r"\bfunction\s+[a-zA-Z_]\w*\s*\("),
        re.compile(r"\b(?:const|let|var)\s+[a-zA-Z_]\w*\s*="),
        re.compile(r"\bconsole\.(?:log|error|warn)\s*\("),
        re.compile(r"\bdocument\.(?:getElementById|querySelector)\s*\("),
        re.compile(r"=>\s*\{"),
        re.compile(r"\baddEventListener\s*\("),
    ],
    "r": [
        re.compile(r"<-"),
        re.compile(r"\bc\s*\([^)]*\)"),
        re.compile(r"\bdata\.frame\s*\("),
        re.compile(r"\blibrary\s*\("),
        re.compile(r"\b(?:barplot|boxplot|hist|plot|pie|abline)\s*\("),
        re.compile(r"\b(?:summary|str|head|tail|dim|nrow|ncol)\s*\("),
        re.compile(r"\b(?:lm|glm|predict|anova|confint|cor)\s*\("),
        re.compile(r"\bcat\s*\("),
    ],
    "html": [
        re.compile(r"<!DOCTYPE\s+html>", re.IGNORECASE),
        re.compile(r"<html\b[^>]*>", re.IGNORECASE),
        re.compile(r"<body\b[^>]*>", re.IGNORECASE),
        re.compile(r"<div\b[^>]*>", re.IGNORECASE),
        re.compile(r"</(?:html|body|div|p|h[1-6])>", re.IGNORECASE),
    ],
    "bash": [
        re.compile(r"^#!\s*/bin/(?:bash|sh)", re.MULTILINE),
        re.compile(r"\becho\s+['\"].+['\"]"),
        re.compile(r"\b(?:grep|awk|sed|chmod|chown)\s+"),
        re.compile(r"\bif\s+\[\s*.+\s*\];\s*then"),
    ],
}


def detect_language(code_snippet: str) -> Tuple[str, int]:
    """
    Analyzes code snippet and returns best matching language and confidence score (0-100).
    """
    if not code_snippet or not code_snippet.strip():
        return "text", 50

    scores: Dict[str, int] = {lang: 0 for lang in LANGUAGE_SIGNATURES}

    for lang, patterns in LANGUAGE_SIGNATURES.items():
        for pat in patterns:
            matches = len(pat.findall(code_snippet))
            if matches > 0:
                scores[lang] += matches * 15

    # Prioritize C++ over C if cout / std / cpp-specific patterns matched
    if scores["cpp"] > 0 and scores["c"] > 0:
        if any(p.search(code_snippet) for p in [re.compile(r"\bcout\b"), re.compile(r"\bcin\b"), re.compile(r"\bstd::\b"), re.compile(r"#\s*include\s*<iostream>")]):
            scores["cpp"] += 30
        else:
            scores["c"] += 20

    best_lang, best_score = max(scores.items(), key=lambda item: item[1])

    if best_score == 0:
        return "text", 40

    confidence = min(98, 50 + best_score)
    return best_lang, confidence
