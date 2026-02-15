import JSZip from 'jszip';

/**
 * Export all documents as JSON
 */
export async function exportToJSON(documents: any[]): Promise<void> {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    documents: documents,
    metadata: {
      totalDocuments: documents.length,
      totalWords: documents.reduce((sum, doc) => sum + (doc.word_count || 0), 0),
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  downloadBlob(blob, `opencontext-export-${Date.now()}.json`);
}

/**
 * Export documents as Markdown files in ZIP
 */
export async function exportToMarkdown(documents: any[]): Promise<void> {
  const zip = new JSZip();

  documents.forEach((doc, index) => {
    const filename = sanitizeFilename(doc.title || `document-${index + 1}`);
    const markdown = convertToMarkdown(doc);
    zip.file(`${filename}.md`, markdown);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `opencontext-export-${Date.now()}.zip`);
}

/**
 * Export single document as PDF
 */
export function exportToPDF(document: any): void {
  // Open print dialog for PDF export
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${document.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 {
            color: #1f2937;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 10px;
          }
          .metadata {
            color: #6b7280;
            font-size: 14px;
            margin: 20px 0;
            padding: 10px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .content {
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <h1>${document.title}</h1>
        <div class="metadata">
          <div>Created: ${new Date(document.created_at).toLocaleDateString()}</div>
          <div>Words: ${document.word_count || 0}</div>
          ${document.url ? `<div>Source: ${document.url}</div>` : ''}
        </div>
        <div class="content">
          ${document.content || ''}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Export to CSV
 */
export function exportToCSV(documents: any[]): void {
  const headers = ['Title', 'URL', 'Word Count', 'Created Date', 'Content'];
  const rows = documents.map(doc => [
    escapeCsvValue(doc.title || ''),
    escapeCsvValue(doc.url || ''),
    doc.word_count || 0,
    new Date(doc.created_at).toLocaleDateString(),
    escapeCsvValue((doc.content || '').substring(0, 1000)),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `opencontext-export-${Date.now()}.csv`);
}

/**
 * Helper: Convert document to Markdown
 */
function convertToMarkdown(doc: any): string {
  return `# ${doc.title}

**Created:** ${new Date(doc.created_at).toLocaleDateString()}
**Words:** ${doc.word_count || 0}
${doc.url ? `**Source:** ${doc.url}` : ''}

---

${doc.content || ''}
`;
}

/**
 * Helper: Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * Helper: Escape CSV value
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Helper: Download blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import from JSON
 */
export async function importFromJSON(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}