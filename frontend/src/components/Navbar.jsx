import React from 'react';
import { BookOpen, Search, Plus, Upload, Sun, Moon, Sparkles } from 'lucide-react';

export default function Navbar({
  searchQuery,
  setSearchQuery,
  theme,
  setTheme,
  onOpenSubjectModal,
  onOpenUploadModal,
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
          />
        </div>
      </div>

      <div className="navbar-actions">
        <button
          className="btn btn-secondary"
          onClick={onOpenDocumentsModal}
          title="Browse and View Uploaded DOCX Manuals on Website"
        >
          <BookOpen size={16} />
          <span>Manuals</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onOpenSubjectModal}
          title="Create New Subject"
        >
          <Plus size={16} />
          <span>New Subject</span>
        </button>

        <button
          className="btn btn-primary"
          onClick={onOpenUploadModal}
          title="Upload Multi-Practical Word Document"
        >
          <Upload size={16} />
          <span>Upload DOCX</span>
        </button>

        {activeSubject && (
          <button
            className="btn btn-secondary"
            onClick={onOpenManualPracticalModal}
            title="Add a practical manually to current subject"
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
