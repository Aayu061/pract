import React, { useState, useEffect } from 'react';
import { X, Save, Code, AlertTriangle } from 'lucide-react';

export default function CodeEditorModal({
  practical,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) {
  const [title, setTitle] = useState('');
  const [practicalNumber, setPracticalNumber] = useState(1);
  const [language, setLanguage] = useState('cpp');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (practical) {
      setTitle(practical.title || '');
      setPracticalNumber(practical.practical_number || 1);
      setLanguage(practical.language || 'cpp');
      setDescription(practical.description || '');
      setCode(practical.code || '');
      setErrorMessage(null);
    }
  }, [practical]);

  if (!isOpen || !practical) return null;

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
    setErrorMessage(null);
    setIsSaving(true);
    try {
      await onSave(practical.id, {
        title,
        practical_number: parseInt(practicalNumber, 10),
        language,
        description,
        code,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error saving practical');
    } finally {
      setIsSaving(false);
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit Practical">
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Code size={20} color="var(--accent-primary)" />
            <h2>Edit Practical Experiment</h2>
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
                <label>Aim / Title</label>
                <input
                  type="text"
                  className="form-control"
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief theory or notes"
              />
            </div>

            {/* In-Browser Code Editor Area */}
            <div className="form-group" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label>Source Code (Only clean code, no output)</label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {lineCount} lines | {code.length} characters (Press Tab to indent)
                </span>
              </div>
              <textarea
                className="form-control code-area"
                rows="16"
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
            {onDelete && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ color: 'var(--danger)', marginRight: 'auto' }}
                onClick={() => {
                  onClose();
                  onDelete(practical);
                }}
              >
                Delete Practical
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
