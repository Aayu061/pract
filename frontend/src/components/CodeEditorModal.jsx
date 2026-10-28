import React, { useState, useEffect } from 'react';
import { X, Save, Code, Check } from 'lucide-react';

export default function CodeEditorModal({
  practical,
  isOpen,
  onClose,
  onSave,
}) {
  const [title, setTitle] = useState('');
  const [practicalNumber, setPracticalNumber] = useState(1);
  const [language, setLanguage] = useState('cpp');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (practical) {
      setTitle(practical.title || '');
      setPracticalNumber(practical.practical_number || 1);
      setLanguage(practical.language || 'cpp');
      setDescription(practical.description || '');
      setCode(practical.code || '');
    }
  }, [practical]);

  if (!isOpen || !practical) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      alert(`Error saving: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Code size={20} color="var(--accent-primary)" />
            <h2>Edit Practical Experiment</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
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
                  {lineCount} lines | {code.length} characters
                </span>
              </div>
              <textarea
                className="form-control code-area"
                rows="16"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                spellCheck="false"
                style={{ resize: 'vertical', minHeight: '260px' }}
              />
            </div>
          </div>

          <div className="modal-footer">
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
