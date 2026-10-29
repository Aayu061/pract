import React, { useState, useRef } from 'react';
import { X, UploadCloud, Loader2, BookOpen, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { uploadDocument } from '../services/api';

export default function DocxViewerUploadModal({
  isOpen,
  onClose,
  onViewDocument,
  onOpenDocumentsList,
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

  const handleUploadAndView = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);

    try {
      const docResult = await uploadDocument(selectedFile, activeSubject?.id || null);
      onClose();
      if (onViewDocument) {
        onViewDocument(docResult);
      }
    } catch (err) {
      setError(err.message || 'Error uploading document to viewer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Upload DOCX to View">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Upload & Read DOCX on Website</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {activeSubject ? `Course: ${activeSubject.code} — ${activeSubject.name}` : 'Interactive in-browser Word document reader'}
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={isLoading} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', gap: '1.1rem' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Upload any course lab manual, reference notes, or assignment file. You can read it directly on the website with high-fidelity paper styling, zoom controls, outline navigation, and table formatting.
          </p>

          {/* Drag & Drop Zone */}
          <div
            className={`dropzone ${isDragging ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '2.2rem 1.5rem', cursor: 'pointer' }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept=".docx"
              style={{ display: 'none' }}
            />
            <div className="dropzone-icon" style={{ marginBottom: '0.75rem' }}>
              <UploadCloud size={30} />
            </div>

            {selectedFile ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', color: '#10b981', fontWeight: 600 }}>
                  <CheckCircle2 size={18} />
                  <span>{selectedFile.name}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                </span>
              </div>
            ) : (
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Click or drag your .docx document here
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Read in browser with full formatting & outline navigation
                </p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.83rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)' }}>
              <FileText size={16} />
              <span>Looking for already uploaded manuals?</span>
            </div>
            {onOpenDocumentsList && (
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', padding: '0.2rem 0.5rem' }}
                onClick={() => {
                  onClose();
                  onOpenDocumentsList();
                }}
              >
                Browse Library →
              </button>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUploadAndView}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Uploading & Rendering...</span>
              </>
            ) : (
              <>
                <BookOpen size={16} />
                <span>Upload & Open in Viewer</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

