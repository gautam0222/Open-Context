'use client';

import { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  FolderIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { exportToJSON, exportToMarkdown, exportToCSV, importFromJSON } from '@/utils/export';
import toast from 'react-hot-toast';

export default function ExportImportPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExport = async (format: 'json' | 'markdown' | 'csv') => {
    setExporting(true);

    try {
      // Fetch all documents
      const response = await fetch('http://localhost:3001/api/documents');
      const data = await response.json();
      const documents = data.documents || [];

      if (documents.length === 0) {
        toast.error('No documents to export');
        return;
      }

      switch (format) {
        case 'json':
          await exportToJSON(documents);
          break;
        case 'markdown':
          await exportToMarkdown(documents);
          break;
        case 'csv':
          exportToCSV(documents);
          break;
      }

      toast.success(`✅ Exported ${documents.length} documents as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export documents');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }

    setImporting(true);

    try {
      const data = await importFromJSON(importFile);

      if (!data.documents || !Array.isArray(data.documents)) {
        throw new Error('Invalid export file format');
      }

      // Import documents
      const response = await fetch('http://localhost:3001/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: data.documents }),
      });

      if (!response.ok) throw new Error('Import failed');

      const result = await response.json();

      toast.success(`✅ Imported ${result.imported} documents!`);
      setImportFile(null);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import documents');
    } finally {
      setImporting(false);
    }
  };

  return (
    <MainLayout
      title="Export & Import"
      description="Backup and restore your knowledge base"
    >
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Export Section */}
        <div className="card p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
              <ArrowDownTrayIcon className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Export Data</h2>
              <p className="text-gray-600">
                Download all your documents in various formats for backup or migration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* JSON Export */}
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition text-left group"
            >
              <DocumentTextIcon className="w-8 h-8 text-brand-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">JSON Format</h3>
              <p className="text-sm text-gray-600 mb-3">
                Complete data with all metadata. Best for re-importing.
              </p>
              <div className="text-sm font-medium text-brand-600 group-hover:underline">
                Export as JSON →
              </div>
            </button>

            {/* Markdown Export */}
            <button
              onClick={() => handleExport('markdown')}
              disabled={exporting}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-left group"
            >
              <FolderIcon className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Markdown Files</h3>
              <p className="text-sm text-gray-600 mb-3">
                Individual .md files in a ZIP. Great for Obsidian, Notion.
              </p>
              <div className="text-sm font-medium text-purple-600 group-hover:underline">
                Export as Markdown →
              </div>
            </button>

            {/* CSV Export */}
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition text-left group"
            >
              <DocumentTextIcon className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">CSV Spreadsheet</h3>
              <p className="text-sm text-gray-600 mb-3">
                Tabular data for Excel, Google Sheets, or analysis.
              </p>
              <div className="text-sm font-medium text-green-600 group-hover:underline">
                Export as CSV →
              </div>
            </button>
          </div>

          {exporting && (
            <div className="mt-6 p-4 bg-brand-50 rounded-lg flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-brand-900 font-medium">Exporting your documents...</span>
            </div>
          )}
        </div>

        {/* Import Section */}
        <div className="card p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowUpTrayIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Import Data</h2>
              <p className="text-gray-600">
                Restore your documents from a previous export or migrate from another app.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* File Input */}
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-500 transition">
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <ArrowUpTrayIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">
                    {importFile ? importFile.name : 'Choose JSON file to import'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Only JSON exports from Open Context are supported
                  </p>
                </div>
              </label>
            </div>

            {importFile && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="btn-primary w-full"
              >
                {importing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Import Documents
                  </>
                )}
              </button>
            )}
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-900">
              <strong>⚠️ Note:</strong> Importing will add documents to your existing library.
              Duplicates may occur if you import the same data multiple times.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <h3 className="font-bold text-gray-900 mb-3">💡 Tips</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Export regularly to keep backups of your knowledge base</li>
            <li>• Markdown exports work great with Obsidian, Notion, and other note apps</li>
            <li>• JSON format preserves all data including collections and metadata</li>
            <li>• CSV is useful for data analysis or migration to other systems</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}