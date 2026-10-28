import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, AlertCircle, FileCheck, Code2, Eye, EyeOff } from 'lucide-react';
import { commitIngestedPracticals } from '../services/api';

export default function SeparationPreviewModal({
  previewData,
  subjects,
  activeSubject,
  isOpen,
  onClose,
  onCommitSuccess,
}) {
  if (!isOpen || !previewData) return null;

  const [practicals, setPracticals] = useState(previewData.practicals || []);
  const [targetSubjectId, setTargetSubjectId] = useState(
    activeSubject?.id || (subjects.length > 0 ? subjects[0].id : '')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedOutputIndex, setExpandedOutputIndex] = useState({});

  const toggleInclude = (idx) => {
    setPracticals((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, include: !item.include } : item))
    );
  };

  const handleUpdateItem = (idx, field, value) => {
    setPracticals((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const toggleOutputView = (idx) => {
    setExpandedOutputIndex((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const includedItems = practicals.filter((p) => p.include);

  const handleCommit = async () => {
    if (!targetSubjectId) {
      alert('Please select a target subject to import practicals into.');
      return;
    }
    if (includedItems.length === 0) {
      alert('Please select at least one practical to import.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        subject_id: targetSubjectId,
        practicals: includedItems.map((item) => ({
          practical_number: parseInt(item.practical_number, 10),
          title: item.title,
          description: item.description,
          language: item.language,
          code: item.code,
        })),
      };

      await commitIngestedPracticals(payload);
      onCommitSuccess(targetSubjectId, includedItems.length);
      onClose();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1100px', height: '90vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileCheck size={22} color="#10b981" />
            <div>
              <h2>Separation Preview & Verification</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Extracted from: <strong>{previewData.filename}</strong> — Found {previewData.total_practicals_found} practicals
              </span>
            </div>
          </div>

          <button className="btn-icon" onClick={onClose} disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        {/* Top Control Bar */}
        <div style={{ padding: '0.85rem 1.75rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Import Into Subject:
            </label>
            <select
              className="form-control"
              value={targetSubjectId}
              onChange={(e) => setTargetSubjectId(e.target.value)}
              style={{ minWidth: '240px' }}
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} — {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Output blocks and terminal prompts have been segregated for review.</span>
          </div>
        </div>

        {/* List of Extracted Practicals */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', gap: '1.25rem' }}>
          {practicals.map((item, idx) => {
            const isOutputExpanded = expandedOutputIndex[idx];
            return (
              <div
                key={idx}
                className="preview-card"
                style={{
                  opacity: item.include ? 1 : 0.5,
                  border: item.include ? '1px solid var(--border-medium)' : '1px dashed var(--border-subtle)',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={item.include}
                      onChange={() => toggleInclude(idx)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                    <span className="practical-num-tag">
                      EXP #{item.practical_number}
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      value={item.title}
                      onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                      style={{ flex: 1, fontWeight: 600 }}
                      placeholder="Practical Title / Aim"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <select
                      className="form-control"
                      value={item.language}
                      onChange={(e) => handleUpdateItem(idx, 'language', e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                    >
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="sql">SQL</option>
                      <option value="r">R</option>
                      <option value="javascript">JavaScript</option>
                      <option value="html">HTML</option>
                      <option value="bash">Bash</option>
                      <option value="text">Text</option>
                    </select>

                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                      {item.confidence}% Match
                    </span>
                  </div>
                </div>

                {/* Split View: Extracted Code vs Discarded Output */}
                <div className="preview-split">
                  {/* Clean Code */}
                  <div>
                    <div className="preview-pane-header pane-code">
                      <span>✓ Clean Source Code (Retained)</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {item.code.split('\n').length} lines
                      </span>
                    </div>
                    <textarea
                      className="form-control code-area"
                      rows="8"
                      value={item.code}
                      onChange={(e) => handleUpdateItem(idx, 'code', e.target.value)}
                      style={{ width: '100%', fontSize: '0.82rem', height: '180px' }}
                      placeholder="No code detected for this section"
                    />
                  </div>

                  {/* Discarded Output */}
                  <div>
                    <div className="preview-pane-header pane-discarded">
                      <span>✕ Filtered Output (Omitted from code)</span>
                      <button
                        type="button"
                        onClick={() => toggleOutputView(idx)}
                        className="btn-ghost"
                        style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        {isOutputExpanded ? <EyeOff size={12} /> : <Eye size={12} />}
                        {isOutputExpanded ? 'Collapse' : 'Inspect'}
                      </button>
                    </div>

                    {item.discarded_output ? (
                      <textarea
                        className="form-control code-area"
                        rows="8"
                        value={item.discarded_output}
                        readOnly
                        style={{
                          width: '100%',
                          fontSize: '0.82rem',
                          height: '180px',
                          color: '#fca5a5',
                          background: 'rgba(239,68,68,0.04)',
                          borderColor: 'rgba(239,68,68,0.2)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '180px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px dashed var(--border-subtle)',
                          borderRadius: '8px',
                          color: 'var(--text-dim)',
                          fontSize: '0.85rem',
                        }}
                      >
                        No output blocks found in this section
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div style={{ marginRight: 'auto', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Selected <strong>{includedItems.length}</strong> of <strong>{practicals.length}</strong> practicals to import
          </div>

          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCommit}
            disabled={isSubmitting || includedItems.length === 0}
          >
            <CheckCircle size={16} />
            <span>{isSubmitting ? 'Importing...' : `Confirm & Import (${includedItems.length})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
