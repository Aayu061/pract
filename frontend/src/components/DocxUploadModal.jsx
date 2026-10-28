import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { previewDocx, uploadDocument } from '../services/api';
import { BookOpen } from 'lucide-react';

export default function DocxUploadModal({
  isOpen,
  onClose,
  onParsedResult,
  onViewDocument,
  activeSubject,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
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
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
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

  const handleViewDirectly = async () => {
    if (!selectedFile) return;
    setIsViewing(true);
    setError(null);

    try {
      const docResult = await uploadDocument(selectedFile, activeSubject?.id || null);
      onClose();
      if (onViewDocument) onViewDocument(docResult);
    } catch (err) {
      setError(err.message || 'Error processing document.');
    } finally {
      setIsViewing(false);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);

    try {
      const docResult = await uploadDocument(selectedFile, activeSubject?.id || null);
      onClose();
      onParsedResult(docResult.practicals_preview);
    } catch (err) {
      setError(err.message || 'Error parsing document.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="var(--accent-primary)" />
            <h2>Upload & Separate Lab DOCX</h2>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={isLoading}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Upload your laboratory manual or compiled practical file. The smart parser will automatically segment each experiment, isolate the Aim, extract clean source code, and strictly filter out terminal outputs and execution logs.
          </p>

          {/* Drag & Drop Zone */}
          <div
            className={`dropzone ${isDragging ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept=".docx"
              style={{ display: 'none' }}
            />
            <div className="dropzone-icon">
              <UploadCloud size={30} />
            </div>

            {selectedFile ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', color: '#10b981', fontWeight: 600 }}>
                  <CheckCircle2 size={18} />
                  <span>{selectedFile.name}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                </span>
              </div>
            ) : (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Drag & drop your .docx lab manual here
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  or click to browse from your computer
                </p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong>💡 Smart Algorithm Highlights:</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <li>Recognizes practical numbering: <code>Practical 1</code>, <code>Experiment 2</code>, Roman numerals</li>
              <li>Filters out terminal dumps, screenshots, and <code>Output:</code> blocks</li>
              <li>Auto-detects language: C++, Python, C, Java, SQL, etc.</li>
              <li>Gives you an interactive side-by-side preview before saving</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer" style={{ gap: '0.6rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading || isViewing}>
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleViewDirectly}
            disabled={!selectedFile || isLoading || isViewing}
            title="Read and view the formatted docx document in the browser"
          >
            {isViewing ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Opening Viewer...</span>
              </>
            ) : (
              <>
                <BookOpen size={16} />
                <span>Read & View on Website</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUploadAndAnalyze}
            disabled={!selectedFile || isLoading || isViewing}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Running Separation...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Analyze & Separate</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
