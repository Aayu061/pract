import React, { useState } from 'react';
import { X, Plus, Code, AlertTriangle } from 'lucide-react';

export default function ManualPracticalModal({
  isOpen,
  onClose,
  activeSubject,
  onCreatePractical,
  suggestedNumber = 1,
}) {
  const [practicalNumber, setPracticalNumber] = useState(suggestedNumber);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sync suggested number
  React.useEffect(() => {
    setPracticalNumber(suggestedNumber);
    setErrorMessage(null);
  }, [suggestedNumber, isOpen]);

  if (!isOpen) return null;

  const handleCodeKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = code;
      setCode(val.substring(0, start) + '    ' + val.substring(end));
      setTimeout(() => {
        if (target) {
          target.selectionStart = target.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !code.trim() || !activeSubject) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onCreatePractical({
        practical_number: parseInt(practicalNumber, 10),
        title: title.trim(),
        language,
        description: description.trim(),
        code: code.trim(),
      });
      setTitle('');
      setCode('');
      setDescription('');
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error creating practical');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lineCount = code ? code.split('\n').length : 0;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add Practical Manually">
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Code size={20} color="var(--accent-primary)" />
            <div>
              <h2>Add Practical Manually</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Target Subject: <strong>{activeSubject ? activeSubject.name : ''}</strong>
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div style={{ margin: '0.75rem 1.75rem 0', padding: '0.65rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px', gap: '1rem' }}>
              <div className="form-group">
                <label>Exp #</label>
                <input
                  type="number"
                  className="form-control"
                  value={practicalNumber}
                  onChange={(e) => setPracticalNumber(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Aim / Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Implementation of Stack using Linked List"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Language</label>
                <select
                  className="form-control"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
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
                  <option value="text">Plain Text</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Objective & Theory (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Brief summary of algorithm, complexity, or objectives"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* In-Browser Code Editor Area */}
            <div className="form-group" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label>Source Code * (Press Tab to indent)</label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {lineCount} lines | {code.length} characters
                </span>
              </div>
              <textarea
                className="form-control code-area"
                rows="16"
                placeholder="// Paste or write clean practical experiment code here"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleCodeKeyDown}
                required
                spellCheck="false"
                style={{ resize: 'vertical', minHeight: '260px' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Plus size={16} />
              <span>{isSubmitting ? 'Saving...' : 'Add Practical'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
