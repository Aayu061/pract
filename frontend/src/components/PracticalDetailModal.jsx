import React, { useState } from 'react';
import { X, Copy, Check, Edit3, Download, Trash2 } from 'lucide-react';
import { getExportPracticalUrl } from '../services/api';

export default function PracticalDetailModal({
  practical,
  subject,
  onClose,
  onEdit,
  onDelete,
  onCopyCode,
}) {
  const [copied, setCopied] = useState(false);

  if (!practical) return null;

  const handleCopy = () => {
    onCopyCode(practical.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeLines = practical.code.split('\n');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="practical-num-tag">
              EXP #{practical.practical_number}
            </span>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>{practical.title}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {subject ? `${subject.code} — ${subject.name}` : ''}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={handleCopy}>
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                onClose();
                onEdit(practical);
              }}
            >
              <Edit3 size={16} />
              <span>Edit</span>
            </button>

            <a
              href={getExportPracticalUrl(practical.id)}
              download
              className="btn btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              <Download size={16} />
              <span>Download</span>
            </a>

            {onDelete && (
              <button
                className="btn btn-ghost"
                style={{ color: 'var(--danger)' }}
                onClick={() => {
                  onClose();
                  onDelete(practical);
                }}
                title="Delete Practical"
              >
                Delete
              </button>
            )}

            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {practical.description && (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Theory & Objective:</strong>
              <p style={{ marginTop: '0.35rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{practical.description}</p>
            </div>
          )}

          {/* Full Code Box with Line Numbers */}
          <div className="code-viewer-container">
            <div className="code-viewer-header">
              <span className="lang-chip">{practical.language}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {codeLines.length} lines | {practical.code.length} characters
              </span>
            </div>

            <div className="code-viewer-content">
              <div className="line-numbers">
                {codeLines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <div className="code-lines">
                <code>{practical.code}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
