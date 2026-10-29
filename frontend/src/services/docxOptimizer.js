import JSZip from 'jszip';

// 1x1 transparent PNG binary bytes (67 bytes)
const TINY_PNG_BYTES = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='),
  (c) => c.charCodeAt(0)
);

/**
 * Optimizes a Word document (.docx) by replacing heavy embedded images
 * with 1x1 placeholders while preserving 100% of headings, code,
 * tables, and paragraphs.
 *
 * This allows large documents (e.g. 7MB - 30MB lab manuals with screenshots)
 * to upload seamlessly to cloud environments (Vercel Serverless Functions)
 * without triggering HTTP 413 (Content Too Large).
 */
export async function optimizeDocxForUpload(file, onStatusUpdate) {
  // If file is already under 3.5MB, upload directly
  if (!file || file.size < 3.5 * 1024 * 1024) {
    return file;
  }

  if (onStatusUpdate) {
    onStatusUpdate('Optimizing large document for cloud upload...');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    let replacedCount = 0;
    zip.forEach((relativePath) => {
      if (relativePath.startsWith('word/media/')) {
        zip.file(relativePath, TINY_PNG_BYTES);
        replacedCount++;
      }
    });

    if (replacedCount === 0) {
      return file;
    }

    const compressedBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    console.info(
      `[DocxOptimizer] Optimized ${file.name}: ${(file.size / 1024).toFixed(1)} KB -> ${(compressedBlob.size / 1024).toFixed(1)} KB (${replacedCount} media items)`
    );

    return new File([compressedBlob], file.name, {
      type: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn('[DocxOptimizer] Skipping optimization, falling back to original:', err);
    return file;
  }
}

