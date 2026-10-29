import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import SubjectSidebar from './components/SubjectSidebar';
import PracticalList from './components/PracticalList';
import PracticalDetailModal from './components/PracticalDetailModal';
import CodeEditorModal from './components/CodeEditorModal';
import DocsToCodeModal from './components/DocsToCodeModal';
import DocxViewerUploadModal from './components/DocxViewerUploadModal';
import SeparationPreviewModal from './components/SeparationPreviewModal';
import SubjectModal from './components/SubjectModal';
import ManualPracticalModal from './components/ManualPracticalModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import DocxViewerModal from './components/DocxViewerModal';
import DocumentsListModal from './components/DocumentsListModal';
import Toast from './components/Toast';
import {
  getSubjects,
  createSubject,
  deleteSubject,
  getPracticals,
  createPractical,
  updatePractical,
  deletePractical,
} from './services/api';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('cs_theme') || 'dark');
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [practicals, setPracticals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [toasts, setToasts] = useState([]);
  const [isLoadingPracticals, setIsLoadingPracticals] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isDocsToCodeOpen, setIsDocsToCodeOpen] = useState(false);
  const [isDocxViewerUploadOpen, setIsDocxViewerUploadOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [viewingDocData, setViewingDocData] = useState(null); // { id, filename }
  const [editingPractical, setEditingPractical] = useState(null);
  const [viewingPractical, setViewingPractical] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState(null); // { type: 'subject' | 'practical', item: object }

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cs_theme', theme);
  }, [theme]);

  // Debounce search query to prevent hammering API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load subjects on mount
  const loadSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    try {
      const data = await getSubjects();
      setSubjects(data);
      if (data.length > 0 && !activeSubject) {
        setActiveSubject(data[0]);
      }
    } catch (err) {
      addToast(err.message || 'Error loading subjects', 'error');
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [activeSubject, addToast]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  // Load practicals whenever activeSubject or debouncedSearchQuery changes
  const loadPracticals = useCallback(async () => {
    if (!activeSubject) {
      setPracticals([]);
      return;
    }
    setIsLoadingPracticals(true);
    try {
      const data = await getPracticals(activeSubject.id, {
        q: debouncedSearchQuery,
      });
      setPracticals(data);
    } catch (err) {
      addToast(err.message || 'Error loading practicals', 'error');
    } finally {
      setIsLoadingPracticals(false);
    }
  }, [activeSubject, debouncedSearchQuery, addToast]);

  // Global Escape key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (viewingPractical) setViewingPractical(null);
        else if (editingPractical) setEditingPractical(null);
        else if (deleteModalTarget) setDeleteModalTarget(null);
        else if (viewingDocData) setViewingDocData(null);
        else if (previewData) setPreviewData(null);
        else if (isDocumentsModalOpen) setIsDocumentsModalOpen(false);
        else if (isDocsToCodeOpen) setIsDocsToCodeOpen(false);
        else if (isDocxViewerUploadOpen) setIsDocxViewerUploadOpen(false);
        else if (isManualModalOpen) setIsManualModalOpen(false);
        else if (isSubjectModalOpen) setIsSubjectModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewingPractical,
    editingPractical,
    deleteModalTarget,
    viewingDocData,
    previewData,
    isDocumentsModalOpen,
    isDocsToCodeOpen,
    isDocxViewerUploadOpen,
    isManualModalOpen,
    isSubjectModalOpen,
  ]);


  useEffect(() => {
    loadPracticals();
  }, [loadPracticals]);

  // Copy code handler
  const handleCopyCode = async (codeText) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codeText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = codeText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      addToast('Code copied to clipboard!', 'success');
    } catch {
      addToast('Failed to copy code', 'error');
    }
  };

  // Subject CRUD
  const handleCreateSubject = async (formData) => {
    const newSub = await createSubject(formData);
    addToast(`Subject "${newSub.name}" created!`, 'success');
    await loadSubjects();
    setActiveSubject(newSub);
  };

  const handleRequestDeleteSubject = (subject) => {
    setDeleteModalTarget({ type: 'subject', item: subject });
  };

  const handleRequestDeletePractical = (practical) => {
    setDeleteModalTarget({ type: 'practical', item: practical });
  };

  const handleConfirmDelete = async (targetId, options = {}) => {
    if (!deleteModalTarget) return;

    if (deleteModalTarget.type === 'subject') {
      try {
        await deleteSubject(targetId);
        addToast(`Subject "${deleteModalTarget.item.name}" deleted`, 'info');
        const updated = subjects.filter((s) => s.id !== targetId);
        setSubjects(updated);
        if (activeSubject?.id === targetId) {
          setActiveSubject(updated.length > 0 ? updated[0] : null);
        }
      } catch (err) {
        addToast(err.message, 'error');
      }
    } else {
      try {
        await deletePractical(targetId, { renumber: options.renumber });
        addToast(`Practical #${deleteModalTarget.item.practical_number} deleted`, 'info');
        if (viewingPractical?.id === targetId) setViewingPractical(null);
        if (editingPractical?.id === targetId) setEditingPractical(null);
        await loadPracticals();
        await loadSubjects();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  // Practical CRUD
  const handleCreatePractical = async (formData) => {
    if (!activeSubject) return;
    const created = await createPractical(activeSubject.id, formData);
    addToast(`Practical #${created.practical_number} added!`, 'success');
    await loadPracticals();
    await loadSubjects();
  };

  const handleUpdatePractical = async (practicalId, formData) => {
    const updated = await updatePractical(practicalId, formData);
    addToast(`Practical #${updated.practical_number} updated!`, 'success');
    await loadPracticals();
  };

  // Ingestion Handlers
  const handleDocxParsed = (parsedData) => {
    setPreviewData(parsedData);
  };

  const handleCommitSuccess = async (targetSubjectId, count) => {
    addToast(`Successfully imported ${count} practicals into subject!`, 'success');
    await loadSubjects();
    const targetSub = subjects.find((s) => s.id === targetSubjectId);
    if (targetSub) {
      setActiveSubject(targetSub);
    }
    await loadPracticals();
  };

  const nextPracticalNumber = practicals.length > 0
    ? Math.max(...practicals.map((p) => p.practical_number)) + 1
    : 1;

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        theme={theme}
        setTheme={setTheme}
        onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
        onOpenDocsToCodeModal={() => setIsDocsToCodeOpen(true)}
        onOpenDocxViewerUploadModal={() => setIsDocxViewerUploadOpen(true)}
        onOpenManualPracticalModal={() => setIsManualModalOpen(true)}
        onOpenDocumentsModal={() => setIsDocumentsModalOpen(true)}
        activeSubject={activeSubject}
      />

      <div className="main-layout">
        {/* Left Sidebar */}
        <SubjectSidebar
          subjects={subjects}
          activeSubject={activeSubject}
          isLoading={isLoadingSubjects}
          onSelectSubject={(sub) => {
            setActiveSubject(sub);
            setSelectedLanguage('All');
          }}
          onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
          onDeleteSubject={handleRequestDeleteSubject}
        />

        {/* Center Content */}
        <main className="content-area">
          <PracticalList
            subject={activeSubject}
            practicals={practicals}
            isLoading={isLoadingPracticals}
            onCopyCode={handleCopyCode}
            onViewPractical={(p) => setViewingPractical(p)}
            onEditPractical={(p) => setEditingPractical(p)}
            onDeletePractical={handleRequestDeletePractical}
            onDeleteSubject={handleRequestDeleteSubject}
            onOpenDocsToCodeModal={() => setIsDocsToCodeOpen(true)}
            onOpenDocxViewerUploadModal={() => setIsDocxViewerUploadOpen(true)}
            onOpenManualModal={() => setIsManualModalOpen(true)}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
          />
        </main>
      </div>

      {/* Floating Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Modals */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onCreateSubject={handleCreateSubject}
      />

      {/* Docs to Code Separation Modal */}
      <DocsToCodeModal
        isOpen={isDocsToCodeOpen}
        onClose={() => setIsDocsToCodeOpen(false)}
        onParsedResult={handleDocxParsed}
        activeSubject={activeSubject}
      />

      {/* Upload DOCX to View on Website */}
      <DocxViewerUploadModal
        isOpen={isDocxViewerUploadOpen}
        onClose={() => setIsDocxViewerUploadOpen(false)}
        onViewDocument={(doc) => setViewingDocData(doc)}
        onOpenDocumentsList={() => setIsDocumentsModalOpen(true)}
        activeSubject={activeSubject}
      />

      <SeparationPreviewModal
        isOpen={Boolean(previewData)}
        previewData={previewData}
        subjects={subjects}
        activeSubject={activeSubject}
        onClose={() => setPreviewData(null)}
        onCommitSuccess={handleCommitSuccess}
      />

      <DocumentsListModal
        isOpen={isDocumentsModalOpen}
        activeSubject={activeSubject}
        onClose={() => setIsDocumentsModalOpen(false)}
        onViewDocument={(doc) => {
          setViewingDocData(doc);
          setIsDocumentsModalOpen(false);
        }}
        onExtractPracticals={(parsedData) => {
          setPreviewData(parsedData);
          setIsDocumentsModalOpen(false);
        }}
      />

      <DocxViewerModal
        isOpen={Boolean(viewingDocData)}
        documentData={viewingDocData}
        documentId={viewingDocData?.id}
        documentFilename={viewingDocData?.filename}
        onClose={() => setViewingDocData(null)}
        onExtractPracticals={(parsedData) => {
          setPreviewData(parsedData);
          setViewingDocData(null);
        }}
        onDeleteSuccess={() => {
          addToast('Document removed', 'info');
          setViewingDocData(null);
        }}
      />

      <ManualPracticalModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        activeSubject={activeSubject}
        onCreatePractical={handleCreatePractical}
        suggestedNumber={nextPracticalNumber}
      />

      <PracticalDetailModal
        practical={viewingPractical}
        subject={activeSubject}
        onClose={() => setViewingPractical(null)}
        onEdit={(p) => setEditingPractical(p)}
        onDelete={handleRequestDeletePractical}
        onCopyCode={handleCopyCode}
      />

      <CodeEditorModal
        isOpen={Boolean(editingPractical)}
        practical={editingPractical}
        onClose={() => setEditingPractical(null)}
        onSave={handleUpdatePractical}
        onDelete={handleRequestDeletePractical}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteModalTarget)}
        type={deleteModalTarget?.type || 'practical'}
        targetItem={deleteModalTarget?.item}
        onClose={() => setDeleteModalTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
