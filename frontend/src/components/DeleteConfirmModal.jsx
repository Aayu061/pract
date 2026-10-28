import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  type = 'practical', // 'practical' | 'subject'
  targetItem,
  onClose,
  onConfirm,
}) {
  const [renumber, setRenumber] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !targetItem) return null;

  const isSubject = type === 'subject';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (isSubject) {
        await onConfirm(targetItem.id);
      } else {
        await onConfirm(targetItem.id, { renumber });
      }
      onClose();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ef4444' }}>
            <AlertTriangle size={22} />
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
              Confirm {isSubject ? 'Subject Deletion' : 'Practical Code Deletion'}
            </h2>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={isDeleting}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5' }}>
            {isSubject ? (
              <>
                Are you sure you want to permanently delete{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {targetItem.code} — {targetItem.name}
                </strong>
                ? All experiments and codes stored under this subject will be removed.
              </>
            ) : (
              <>
                Are you sure you want to delete{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  Practical #{targetItem.practical_number}: {targetItem.title}
                </strong>
                ? This action cannot be undone.
              </>
            )}
          </p>

          {!isSubject && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 0.9rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
              onClick={() => setRenumber(!renumber)}
            >
              <input
                type="checkbox"
                checked={renumber}
                onChange={(e) => setRenumber(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
              />
              <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                Auto-shift subsequent practical numbers (e.g. Exp #3 becomes #2)
              </label>
            </div>
          )}

          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.82rem',
            }}
          >
            <strong>Warning:</strong> Deletion is immediate and permanently removes the record from the database.
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            style={{
              background: '#ef4444',
              color: '#fff',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
            }}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'Deleting...' : isSubject ? 'Delete Subject' : 'Delete Practical'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
