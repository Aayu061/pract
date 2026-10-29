import React, { useState, useRef } from 'react';
import { X, UploadCloud, Loader2, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Code2 } from 'lucide-react';
import { previewDocx } from '../services/api';

export default function DocsToCodeModal({
  isOpen,
  onClose,
  onParsedResult,
  activeSubject,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('Please select a valid Microsoft Word (.docx) document.');
      return;
    }
    setSelectedFile(file);
  };

  const handleAnalyzeAndSeparate = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);

    try {
      const parsedData = await previewDocx(selectedFile);
      onClose();
      onParsedResult(parsedData);
    } catch (err) {
      setError(err.message || 'Error separating code from document.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Docs to Code Separation">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={20} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Docs to Code Separation</h2>
                <span className="brand-badge" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>AI ENGINE</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {activeSubject ? `Target Subject: ${activeSubject.code} (${activeSubject.name})` : 'Extract experiments into your subjects'}
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={isLoading} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', gap: '1rem' }}>
          {/* Workflow Steps Indicator */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: selectedFile ? '#10b981' : 'var(--accent-primary)', fontWeight: 600 }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: selectedFile ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>1</span>
              <span>Upload Manual</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>2</span>
              <span>Filter Outputs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>3</span>
              <span>Commit to Lab</span>
            </div>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Upload your laboratory manual or multi-experiment DOCX file. The engine will split each practical, isolate the Aim, extract clean source code, and automatically segregate terminal outputs and execution logs.
          </p>

          {/* Drag & Drop Zone */}
          <div
            className={`dropzone ${isDragging ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '2rem 1.5rem', cursor: 'pointer' }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept=".docx"
              style={{ display: 'none' }}
            />
            <div className="dropzone-icon" style={{ marginBottom: '0.75rem' }}>
              <UploadCloud size={28} />
            </div>

            {selectedFile ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', color: '#10b981', fontWeight: 600 }}>
                  <CheckCircle2 size={18} />
                  <span>{selectedFile.name}</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB — Ready to separate
                </span>
              </div>
            ) : (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Drop your lab manual .docx here
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  Supports multi-practical C++, Python, Java, C, and SQL documents
                </p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', background: 'rgba(16,185,129,0.06)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.8rem', color: '#34d399' }}>
            <ShieldCheck size={16} />
            <span>Smart AST sanitization guarantees clean compilable code with zero terminal clutter.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAnalyzeAndSeparate}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Separating Experiments...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Analyze & Separate</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

