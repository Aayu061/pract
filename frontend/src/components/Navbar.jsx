import React from 'react';
import { BookOpen, Search, Plus, Sun, Moon, Sparkles, FileText } from 'lucide-react';

export default function Navbar({
  searchQuery,
  setSearchQuery,
  theme,
  setTheme,
  onOpenSubjectModal,
  onOpenDocsToCodeModal,
  onOpenDocxViewerUploadModal,
  onOpenManualPracticalModal,
  onOpenDocumentsModal,
  activeSubject,
}) {
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="navbar">
      <div className="brand">
        <BookOpen size={24} color="#6366f1" />
        <span>CS LabPortal</span>
        <span className="brand-badge">PRO</span>
      </div>

      <div className="navbar-center">
        <div className="search-bar">
          <Search size={18} color="var(--text-dim)" />
          <input
            type="text"
            placeholder={activeSubject ? `Search in ${activeSubject.code}... (e.g. linked list, binary search)` : "Search practicals by title or code..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search practicals"
          />
        </div>
      </div>

      <div className="navbar-actions">
        {/* View DOCX on Website */}
        <button
          className="btn btn-secondary"
          onClick={onOpenDocxViewerUploadModal}
          title="Upload DOCX to read and view on website"
          aria-label="Upload DOCX to view on website"
        >
          <FileText size={16} />
          <span>Read DOCX</span>
        </button>

        {/* Separate Docs to Code */}
        <button
          className="btn btn-primary"
          onClick={onOpenDocsToCodeModal}
          title="Extract code experiments from DOCX lab manual"
          aria-label="Extract practicals from DOCX"
          style={{ background: 'var(--accent-gradient)', borderColor: 'transparent' }}
        >
          <Sparkles size={16} />
          <span>Docs to Code</span>
        </button>

        {/* Manuals Library */}
        <button
          className="btn btn-secondary"
          onClick={onOpenDocumentsModal}
          title="Browse uploaded DOCX manuals library"
          aria-label="Browse manuals library"
        >
          <BookOpen size={16} />
          <span>Manuals</span>
        </button>

        {/* New Subject */}
        <button
          className="btn btn-secondary"
          onClick={onOpenSubjectModal}
          title="Create New Subject"
          aria-label="Create new subject"
        >
          <Plus size={16} />
          <span>New Subject</span>
        </button>

        {activeSubject && (
          <button
            className="btn btn-secondary"
            onClick={onOpenManualPracticalModal}
            title="Add a practical manually to current subject"
            aria-label="Add practical manually"
          >
            <Plus size={16} />
            <span>Add Practical</span>
          </button>
        )}

        <button
          className="btn-icon"
          onClick={toggleTheme}
          aria-label="Toggle Dark/Light Mode"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
