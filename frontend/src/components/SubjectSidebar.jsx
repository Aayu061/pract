import React from 'react';
import { Layers, Plus, Trash2, FolderCode } from 'lucide-react';

export default function SubjectSidebar({
  subjects,
  activeSubject,
  onSelectSubject,
  onOpenSubjectModal,
  onDeleteSubject,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="var(--accent-primary)" />
          <span className="sidebar-title">Subjects & Labs</span>
        </div>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
          onClick={onOpenSubjectModal}
          title="Add new subject"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="subject-nav-list">
        {subjects.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            <FolderCode size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p>No subjects yet.</p>
            <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>Click "+ Add" to create your first Computer Science subject or upload a DOCX manual!</p>
          </div>
        ) : (
          subjects.map((sub) => {
            const isActive = activeSubject && activeSubject.id === sub.id;
            return (
              <div
                key={sub.id}
                className={`subject-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectSubject(sub)}
              >
                <div className="subject-info">
                  <span className="subject-code" style={{ color: sub.color || 'var(--accent-primary)' }}>
                    {sub.code}
                  </span>
                  <span className="subject-name" title={sub.name}>
                    {sub.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {sub.semester}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="subject-badge">
                    {sub.practical_count}
                  </span>
                  <button
                    className="btn-ghost"
                    style={{ padding: '0.25rem', borderRadius: '4px', color: 'var(--text-dim)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSubject(sub);
                    }}
                    title="Delete Subject"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
