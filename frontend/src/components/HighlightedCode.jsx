import React, { useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';

const LANG_MAP = {
  cpp: 'cpp',
  'c++': 'cpp',
  c: 'c',
  python: 'python',
  py: 'python',
  java: 'java',
  sql: 'sql',
  javascript: 'javascript',
  js: 'javascript',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  html: 'markup',
};

export default function HighlightedCode({ code = '', language = 'cpp', showLineNumbers = false }) {
  const normalizedLang = (language || 'cpp').toLowerCase();
  const prismLang = LANG_MAP[normalizedLang] || 'clike';

  const highlightedHtml = useMemo(() => {
    if (!code) return '';
    const grammar = Prism.languages[prismLang] || Prism.languages.clike || Prism.languages.javascript;
    try {
      return Prism.highlight(code, grammar, prismLang);
    } catch {
      return code;
    }
  }, [code, prismLang]);

  const lines = useMemo(() => code.split('\n'), [code]);

  if (!showLineNumbers) {
    return (
      <code
        className={`language-${prismLang}`}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    );
  }

  return (
    <div className="code-viewer-content">
      <div className="line-numbers">
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <div className="code-lines">
        <code
          className={`language-${prismLang}`}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </div>
    </div>
  );
}
