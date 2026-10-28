import React, { useState } from 'react';
import {
  Copy,
  Check,
  Edit3,
  Download,
  Code2,
  FileArchive,
  Plus,
  Upload,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { getExportPracticalUrl, getExportSubjectZipUrl } from '../services/api';

export default function PracticalList({
  subject,
  practicals,
  onCopyCode,
  onViewPractical,
  onEditPractical,
  onDeletePractical,
  onOpenUploadModal,
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
          Select a subject from the left sidebar to view practicals, or create a new subject / upload a lab manual `.docx` file to automatically parse experiments!
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={onOpenUploadModal}>
            <Upload size={16} /> Upload Lab DOCX
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 2 }}>
          <button
            className="btn btn-secondary"
            onClick={onOpenManualModal}
            title="Add a single practical manually"
          >
            <Plus size={16} /> Add Practical
          </button>

          <button
            className="btn btn-primary"
            onClick={onOpenUploadModal}
            title="Upload and separate docx lab manual"
          >
            <Upload size={16} /> Ingest DOCX
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
      {filteredPracticals.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <Code2 size={40} style={{ opacity: 0.4 }} />
          <h3>No practicals found</h3>
          <p style={{ fontSize: '0.9rem' }}>
            {practicals.length === 0
              ? 'This subject is currently empty. Add practicals manually or upload a .docx lab manual to auto-separate experiments.'
              : 'No practicals match the current filter criteria.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button className="btn btn-primary" onClick={onOpenUploadModal}>
              <Upload size={16} /> Ingest DOCX Manual
            </button>
            <button className="btn btn-secondary" onClick={onOpenManualModal}>
              <Plus size={16} /> Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="practicals-grid">
          {filteredPracticals.map((p) => {
            const isCopied = copiedId === p.id;
            return (
              <div
                key={p.id}
                className="practical-card"
                onClick={() => onViewPractical(p)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-top">
                  <span className="practical-num-tag">
                    EXP #{p.practical_number}
                  </span>

                  <div className="card-actions-quick" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-icon"
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
                      onClick={() => {
                        if (window.confirm(`Delete Practical #${p.practical_number}: "${p.title}"?`)) {
                          onDeletePractical(p.id);
                        }
                      }}
                      title="Delete Practical"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="card-title">{p.title}</h3>

                {p.description && <p className="card-desc">{p.description}</p>}

                {/* Code Preview Box */}
                <div className="code-preview-box">
                  <code>{p.code}</code>
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
