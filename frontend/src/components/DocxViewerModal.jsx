import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  FileText,
  Download,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  List,
  ChevronRight,
  Loader2,
  BookOpen,
  Trash2,
} from 'lucide-react';
import { getDocumentHtml, getDocumentDownloadUrl, deleteDocument } from '../services/api';

export default function DocxViewerModal({
  isOpen,
  documentData,
  documentId,
  documentFilename,
  onClose,
  onExtractPracticals,
  onDeleteSuccess,
}) {
  const [zoom, setZoom] = useState(100);
  const [showToc, setShowToc] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [tocList, setTocList] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const contentContainerRef = useRef(null);

  const effectiveDoc = useMemo(
    () => documentData || (documentId ? { id: documentId, filename: documentFilename } : null),
    [documentData, documentId, documentFilename]
  );

  useEffect(() => {
    if (!isOpen || !effectiveDoc) return;

    if (effectiveDoc.html && effectiveDoc.toc) {
      setHtmlContent(effectiveDoc.html);
      setTocList(effectiveDoc.toc);
      setWordCount(effectiveDoc.word_count || 0);
      return;
    }

    // Otherwise fetch via document id
    if (effectiveDoc.id) {
      setIsLoading(true);
      getDocumentHtml(effectiveDoc.id)
        .then((res) => {
          setHtmlContent(res.html);
          setTocList(res.toc || []);
          setWordCount(res.word_count || 0);
        })
        .catch((err) => {
          console.error('Failed to load document HTML:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, effectiveDoc]);

  if (!isOpen || !effectiveDoc) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 70));
  const handleResetZoom = () => setZoom(100);

  const scrollToHeading = (id) => {
    setActiveHeadingId(id);
    const target = contentContainerRef.current?.querySelector(`#${id}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleExtractClick = () => {
    if (effectiveDoc.practicals_preview) {
      onExtractPracticals(effectiveDoc.practicals_preview);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${effectiveDoc.filename}"?`)) return;
    try {
      if (effectiveDoc.id) {
        await deleteDocument(effectiveDoc.id);
        if (onDeleteSuccess) onDeleteSuccess(effectiveDoc.id);
        onClose();
      }
    } catch (e) {
      console.error(`Delete failed: ${e.message}`);
    }
  };

  return (
    <div className="modal-overlay docx-viewer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="DOCX Viewer">
      <div
        className="modal-content docx-viewer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Document Header & Reading Toolbar */}
        <div className="docx-viewer-header">
          <div className="docx-header-left">
            <div className="doc-icon-badge">
              <FileText size={22} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 className="docx-modal-title">{effectiveDoc.filename}</h2>
              <div className="docx-meta-chips">
                <span className="doc-chip">
                  {(effectiveDoc.file_size ? effectiveDoc.file_size / 1024 : 0).toFixed(1)} KB
                </span>
                {wordCount > 0 && <span className="doc-chip">{wordCount} words</span>}
                {effectiveDoc.parsed_practical_count > 0 && (
                  <span className="doc-chip doc-chip-highlight">
                    {effectiveDoc.parsed_practical_count} Practicals Detected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reading Controls */}
          <div className="docx-header-actions">
            {/* Zoom controls */}
            <div className="zoom-toolbar">
              <button
                className="btn-icon"
                onClick={handleZoomOut}
                title="Zoom Out"
                disabled={zoom <= 70}
                aria-label="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="zoom-indicator" onClick={handleResetZoom} title="Reset zoom">
                {zoom}%
              </span>
              <button
                className="btn-icon"
                onClick={handleZoomIn}
                title="Zoom In"
                disabled={zoom >= 160}
                aria-label="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              {zoom !== 100 && (
                <button className="btn-icon" onClick={handleResetZoom} title="Reset zoom" aria-label="Reset zoom">
                  <RotateCcw size={14} />
                </button>
              )}
            </div>

            {/* TOC toggle */}
            {tocList.length > 0 && (
              <button
                className={`btn btn-secondary ${showToc ? 'active-toc-btn' : ''}`}
                onClick={() => setShowToc((prev) => !prev)}
                title="Toggle Table of Contents"
                aria-label="Toggle Outline"
              >
                <List size={15} />
                <span>Outline ({tocList.length})</span>
              </button>
            )}

            {/* Extract Practicals */}
            {effectiveDoc.practicals_preview && (
              <button className="btn btn-primary" onClick={handleExtractClick} aria-label="Extract practicals">
                <Sparkles size={16} />
                <span>Extract Practicals</span>
              </button>
            )}

            {/* Download Original DOCX */}
            {effectiveDoc.id && (
              <a
                href={getDocumentDownloadUrl(effectiveDoc.id)}
                download={effectiveDoc.filename}
                className="btn btn-secondary"
                title="Download original .docx"
                aria-label="Download original DOCX file"
              >
                <Download size={15} />
                <span>Download</span>
              </a>
            )}

            {/* Delete button */}
            {effectiveDoc.id && (
              <button
                className="btn-icon"
                onClick={handleDelete}
                style={{ color: 'var(--danger)' }}
                title="Delete document"
                aria-label="Delete document"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button className="btn-icon" onClick={onClose} title="Close viewer" aria-label="Close viewer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Viewer Main Body */}
        <div className="docx-viewer-body">
          {/* Collapsible Table of Contents Sidebar */}
          {showToc && tocList.length > 0 && (
            <aside className="docx-toc-sidebar">
              <div className="docx-toc-header">
                <BookOpen size={16} color="var(--accent-primary)" />
                <span>Table of Contents</span>
              </div>
              <ul className="docx-toc-list">
                {tocList.map((item, idx) => (
                  <li
                    key={idx}
                    className={`docx-toc-item level-${item.level} ${
                      activeHeadingId === item.id ? 'active' : ''
                    }`}
                    onClick={() => scrollToHeading(item.id)}
                  >
                    <ChevronRight size={12} className="toc-chevron" />
                    <span className="toc-title">{item.title}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {/* Document Content View Area */}
          <div className="docx-content-scroll" ref={contentContainerRef}>
            {isLoading ? (
              <div className="docx-loading-state">
                <Loader2 size={36} className="spin-animation" />
                <p>Rendering formatted document...</p>
              </div>
            ) : (
              <div
                className="docx-paper-wrapper"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              >
                <article
                  className="docx-paper-page"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
