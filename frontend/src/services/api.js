const API_BASE = '/api';

export async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData && errData.detail) {
        errorMsg = errData.detail;
      }
    } catch (e) {
      // Ignore fallback
    }
    throw new Error(errorMsg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Subjects
export async function getSubjects() {
  return fetchJson(`${API_BASE}/subjects`);
}

export async function createSubject(data) {
  return fetchJson(`${API_BASE}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateSubject(id, data) {
  return fetchJson(`${API_BASE}/subjects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteSubject(id) {
  return fetchJson(`${API_BASE}/subjects/${id}`, {
    method: 'DELETE',
  });
}

// Practicals
export async function getPracticals(subjectId, { q = '', language = '' } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (language) params.set('language', language);
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return fetchJson(`${API_BASE}/subjects/${subjectId}/practicals${queryStr}`);
}

export async function getPractical(practicalId) {
  return fetchJson(`${API_BASE}/practicals/${practicalId}`);
}

export async function createPractical(subjectId, data) {
  return fetchJson(`${API_BASE}/subjects/${subjectId}/practicals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updatePractical(practicalId, data) {
  return fetchJson(`${API_BASE}/practicals/${practicalId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletePractical(practicalId, { renumber = false } = {}) {
  const queryStr = renumber ? '?renumber=true' : '';
  return fetchJson(`${API_BASE}/practicals/${practicalId}${queryStr}`, {
    method: 'DELETE',
  });
}

// Ingestion (DOCX)
export async function previewDocx(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/ingest/preview-docx`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errorMsg = 'Failed to parse .docx file';
    try {
      const err = await res.json();
      if (err.detail) errorMsg = err.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function commitIngestedPracticals(payload) {
  return fetchJson(`${API_BASE}/ingest/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getExportPracticalUrl(practicalId) {
  return `${API_BASE}/practicals/${practicalId}/export`;
}

export function getExportSubjectZipUrl(subjectId) {
  return `${API_BASE}/subjects/${subjectId}/export-zip`;
}
