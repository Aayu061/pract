import React, { useState } from 'react';
import {
  Copy,
  Check,
  Edit3,
  Download,
  Code2,
  FileArchive,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  FileText,
} from 'lucide-react';
import { getExportPracticalUrl, getExportSubjectZipUrl } from '../services/api';
import HighlightedCode from './HighlightedCode';

export default function PracticalList({
  subject,
  practicals,
  isLoading = false,
  onCopyCode,
  onViewPractical,
  onEditPractical,
  onDeletePractical,
  onDeleteSubject,
  onOpenDocsToCodeModal,
  onOpenDocxViewerUploadModal,
  onOpenManualModal,
  selectedLanguage,
  setSelectedLanguage,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (practical, e) => {
    e.stopPropagation();
    onCopyCode(practical.code);
    setCopiedId(practical.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Distinct languages
  const availableLanguages = ['All', ...new Set(practicals.map((p) => p.language).filter(Boolean))];

  const filteredPracticals = selectedLanguage === 'All'
    ? practicals
    : practicals.filter((p) => p.language.toLowerCase() === selectedLanguage.toLowerCase());

  if (!subject) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Code2 size={36} />
        </div>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>
          Welcome to CS LabPortal
        </h2>
        <p style={{ maxWidth: '480px', color: 'var(--text-muted)' }}>
          Select a subject from the left sidebar to view practicals, extract experiments from your lab manuals, or read DOCX documents directly on the website!
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={onOpenDocsToCodeModal}
            style={{ background: 'var(--accent-gradient)', borderColor: 'transparent' }}
          >
            <Sparkles size={16} /> Docs to Code Separation
          </button>
          <button className="btn btn-secondary" onClick={onOpenDocxViewerUploadModal}>
            <FileText size={16} /> Read DOCX on Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Subject Header Banner */}
      <div className="subject-banner">
        <div className="subject-banner-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                background: subject.color || 'var(--accent-primary)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}
            >
              {subject.code}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {subject.department}
            </span>
          </div>

          <h1>{subject.name}</h1>

          <div className="subject-banner-meta">
            <span className="meta-chip">{subject.semester}</span>
            <span className="meta-chip">{practicals.length} Experiments</span>
            {subject.description && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                {subject.description}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 2, flexWrap: 'wrap' }}>
          {/* Read DOCX on Website button */}
          <button
            className="btn btn-secondary"
            onClick={onOpenDocxViewerUploadModal}
            title="Upload DOCX to view and read on website"
          >
            <FileText size={16} /> Read DOCX
          </button>

          {/* Docs to Code Separation button */}
          <button
            className="btn btn-primary"
            onClick={onOpenDocsToCodeModal}
            title="Extract & separate practical experiments from DOCX"
            style={{ background: 'var(--accent-gradient)', borderColor: 'transparent' }}
          >
            <Sparkles size={16} /> Docs to Code
          </button>

          <button
            className="btn btn-secondary"
            onClick={onOpenManualModal}
            title="Add a single practical manually"
          >
            <Plus size={16} /> Add Practical
          </button>

          {practicals.length > 0 && (
            <a
              href={getExportSubjectZipUrl(subject.id)}
              download
              className="btn btn-secondary"
              title="Download all practicals in this subject as a ZIP archive"
            >
              <FileArchive size={16} /> Export ZIP
            </a>
          )}

          <button
            className="btn btn-ghost"
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            onClick={() => onDeleteSubject(subject)}
            title="Delete this entire subject and all experiments"
          >
            <Trash2 size={16} /> Delete Subject
          </button>
        </div>
      </div>

      {/* Language Filter Pills */}
      {availableLanguages.length > 2 && (
        <div className="filter-bar">
          <div className="language-pills">
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginRight: '0.4rem' }}>
              LANGUAGE:
            </span>
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                className={`pill ${selectedLanguage === lang ? 'active' : ''}`}
                onClick={() => setSelectedLanguage(lang)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Practicals Cards Grid */}
      {isLoading ? (
        <div className="practicals-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-card">
              <div className="skeleton-line" style={{ width: '30%', height: '20px', marginBottom: '1rem', borderRadius: '4px' }} />
              <div className="skeleton-line" style={{ width: '85%', height: '22px', marginBottom: '0.75rem', borderRadius: '4px' }} />
              <div className="skeleton-line" style={{ width: '95%', height: '14px', marginBottom: '0.5rem', borderRadius: '4px' }} />
              <div className="skeleton-line" style={{ width: '70%', height: '14px', marginBottom: '1rem', borderRadius: '4px' }} />
              <div className="skeleton-code-box" style={{ height: '120px', marginTop: '0.5rem', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      ) : filteredPracticals.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <Code2 size={40} style={{ opacity: 0.4 }} />
          <h3>No practicals found</h3>
          <p style={{ fontSize: '0.9rem' }}>
            {practicals.length === 0
              ? 'This subject is currently empty. Extract practicals from a DOCX lab manual, read documents on the website, or add experiments manually.'
              : 'No practicals match the current filter criteria.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={onOpenDocsToCodeModal}
              style={{ background: 'var(--accent-gradient)', borderColor: 'transparent' }}
            >
              <Sparkles size={16} /> Docs to Code Separation
            </button>
            <button className="btn btn-secondary" onClick={onOpenDocxViewerUploadModal}>
              <FileText size={16} /> Read DOCX on Website
            </button>
            <button className="btn btn-secondary" onClick={onOpenManualModal}>
              <Plus size={16} /> Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="practicals-grid">
          {filteredPracticals.map((p, idx) => {
            const isCopied = copiedId === p.id;
            return (
              <div
                key={p.id}
                className="practical-card animate-card-entrance"
                onClick={() => onViewPractical(p)}
                style={{
                  cursor: 'pointer',
                  animationDelay: `${Math.min(idx * 0.05, 0.4)}s`,
                }}
              >
                <div className="card-top">
                  <span className="practical-num-tag">
                    EXP #{p.practical_number}
                  </span>

                  <div className="card-actions-quick" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`btn-icon ${isCopied ? 'copied-bounce' : ''}`}
                      style={{ width: '32px', height: '32px' }}
                      onClick={(e) => handleCopy(p, e)}
                      title="Copy Code to Clipboard"
                    >
                      {isCopied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                    </button>

                    <button
                      className="btn-icon"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => onEditPractical(p)}
                      title="Edit Code"
                    >
                      <Edit3 size={15} />
                    </button>

                    <a
                      href={getExportPracticalUrl(p.id)}
                      download
                      className="btn-icon"
                      style={{ width: '32px', height: '32px', textDecoration: 'none' }}
                      title="Download Source Code File"
                    >
                      <Download size={15} />
                    </a>

                    <button
                      className="btn-icon"
                      style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                      onClick={() => onDeletePractical(p)}
                      title="Delete Practical"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="card-title">{p.title}</h3>

                {p.description && <p className="card-desc">{p.description}</p>}

                {/* Code Preview Box with Syntax Highlighting */}
                <div className="code-preview-box">
                  <HighlightedCode code={p.code} language={p.language} showLineNumbers={false} />
                </div>

                <div className="card-footer">
                  <span className="lang-chip">{p.language}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    View Details <ExternalLink size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
