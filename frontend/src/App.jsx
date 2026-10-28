import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import SubjectSidebar from './components/SubjectSidebar';
import PracticalList from './components/PracticalList';
import PracticalDetailModal from './components/PracticalDetailModal';
import CodeEditorModal from './components/CodeEditorModal';
import DocxUploadModal from './components/DocxUploadModal';
import SeparationPreviewModal from './components/SeparationPreviewModal';
import SubjectModal from './components/SubjectModal';
import ManualPracticalModal from './components/ManualPracticalModal';
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
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [toasts, setToasts] = useState([]);

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingPractical, setEditingPractical] = useState(null);
  const [viewingPractical, setViewingPractical] = useState(null);
  const [previewData, setPreviewData] = useState(null);

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

  // Load subjects on mount
  const loadSubjects = useCallback(async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
      if (data.length > 0 && !activeSubject) {
        setActiveSubject(data[0]);
      }
    } catch (err) {
      addToast(err.message || 'Error loading subjects', 'error');
    }
  }, [activeSubject, addToast]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  // Load practicals whenever activeSubject or searchQuery changes
  const loadPracticals = useCallback(async () => {
    if (!activeSubject) {
      setPracticals([]);
      return;
    }
    try {
      const data = await getPracticals(activeSubject.id, {
        q: searchQuery,
      });
      setPracticals(data);
    } catch (err) {
      addToast(err.message || 'Error loading practicals', 'error');
    }
  }, [activeSubject, searchQuery, addToast]);

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
    } catch (e) {
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

  const handleDeleteSubject = async (subjectId) => {
    try {
      await deleteSubject(subjectId);
      addToast('Subject and practicals deleted', 'info');
      const updated = subjects.filter((s) => s.id !== subjectId);
      setSubjects(updated);
      if (activeSubject?.id === subjectId) {
        setActiveSubject(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      addToast(err.message, 'error');
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

  const handleDeletePractical = async (practicalId) => {
    try {
      await deletePractical(practicalId);
      addToast('Practical deleted', 'info');
      await loadPracticals();
      await loadSubjects();
    } catch (err) {
      addToast(err.message, 'error');
    }
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
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenManualPracticalModal={() => setIsManualModalOpen(true)}
        activeSubject={activeSubject}
      />

      <div className="main-layout">
        {/* Left Sidebar */}
        <SubjectSidebar
          subjects={subjects}
          activeSubject={activeSubject}
          onSelectSubject={(sub) => {
            setActiveSubject(sub);
            setSelectedLanguage('All');
          }}
          onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
          onDeleteSubject={handleDeleteSubject}
        />

        {/* Center Content */}
        <main className="content-area">
          <PracticalList
            subject={activeSubject}
            practicals={practicals}
            onCopyCode={handleCopyCode}
            onViewPractical={(p) => setViewingPractical(p)}
            onEditPractical={(p) => setEditingPractical(p)}
            onDeletePractical={handleDeletePractical}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
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

      <DocxUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onParsedResult={handleDocxParsed}
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
        onCopyCode={handleCopyCode}
      />

      <CodeEditorModal
        isOpen={Boolean(editingPractical)}
        practical={editingPractical}
        onClose={() => setEditingPractical(null)}
        onSave={handleUpdatePractical}
      />
    </div>
  );
}
