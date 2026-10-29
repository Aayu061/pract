import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  BookOpen,
  Download,
  Trash2,
  Calendar,
  Loader2,
  FolderOpen,
  AlertTriangle,
} from 'lucide-react';
import { getDocuments, uploadDocument, getDocumentDownloadUrl, deleteDocument } from '../services/api';
import { optimizeDocxForUpload } from '../services/docxOptimizer';

export default function DocumentsListModal({
  isOpen,
  onClose,
  activeSubject,
  onViewDocument,
  _onExtractPracticals,
}) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  const loadDocs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getDocuments(activeSubject?.id || null);
      setDocuments(data);
    } catch (e) {
      setErrorMessage(e.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [activeSubject]);

  useEffect(() => {
    if (isOpen) {
      loadDocs();
    }
  }, [isOpen, loadDocs]);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setErrorMessage('Please select a valid .docx Word document.');
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    try {
      const fileToUpload = await optimizeDocxForUpload(file);
      const docResult = await uploadDocument(fileToUpload, activeSubject?.id || null);
      await loadDocs();
      // Directly open in viewer
      onViewDocument(docResult);
      onClose();
    } catch (err) {
      setErrorMessage(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (doc, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete document "${doc.filename}"?`)) return;
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setErrorMessage(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Documents List">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookOpen size={22} color="var(--accent-primary)" />
            <div>
              <h2>DOCX Manuals & Lab Documents</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {activeSubject ? `Filtered for ${activeSubject.code} — ${activeSubject.name}` : 'All uploaded manuals'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".docx"
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Upload DOCX"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Upload & View DOCX</span>
                </>
              )}
            </button>
            <button className="btn-icon" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div style={{ margin: '0.75rem 1.75rem 0', padding: '0.65rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="spin-animation" style={{ margin: '0 auto 0.75rem' }} />
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
              <FolderOpen size={38} style={{ opacity: 0.4 }} />
              <h3 style={{ marginTop: '0.5rem', color: 'var(--text-main)' }}>No DOCX Manuals Stored Yet</h3>
              <p style={{ maxWidth: '420px', fontSize: '0.88rem' }}>
                Upload your course lab manual or syllabus Word document to read it on the website and extract practical experiments.
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '0.75rem' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} /> Select .docx to View
              </button>
            </div>
          ) : (
            <div className="documents-list">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="document-card-item"
                  onClick={() => {
                    onViewDocument(doc);
                    onClose();
                  }}
                >
                  <div className="doc-card-icon">
                    <FileText size={24} color="var(--accent-primary)" />
                  </div>

                  <div className="doc-card-info">
                    <h4 className="doc-card-title">{doc.filename}</h4>
                    <div className="doc-card-meta">
                      <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{doc.parsed_practical_count} experiments</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="doc-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        onViewDocument(doc);
                        onClose();
                      }}
                      title="Read Document in Browser"
                      aria-label="Read document in browser"
                    >
                      <BookOpen size={14} />
                      <span>Read</span>
                    </button>

                    <a
                      href={getDocumentDownloadUrl(doc.id)}
                      download={doc.filename}
                      className="btn-icon"
                      title="Download original .docx"
                      aria-label="Download original DOCX file"
                    >
                      <Download size={15} />
                    </a>

                    <button
                      className="btn-icon"
                      style={{ color: 'var(--danger)' }}
                      onClick={(e) => handleDelete(doc, e)}
                      title="Delete document"
                      aria-label="Delete document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
