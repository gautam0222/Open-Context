'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: 'all' | 'stats') => {
    setExporting(true);
    const endpoint = type === 'all' 
      ? 'http://localhost:3001/api/export/documents'
      : 'http://localhost:3001/api/export/stats';

    const promise = fetch(endpoint)
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = type === 'all' ? 'open-context-export.json' : 'stats-report.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });

    toast.promise(promise, {
      loading: 'Exporting...',
      success: 'Export downloaded!',
      error: 'Export failed',
    });

    try {
      await promise;
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition flex items-center gap-2"
      >
        📤 Export
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-20">
            <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold">
              Export Options
            </div>
            <div className="p-2">
              <button
                onClick={() => handleExport('all')}
                disabled={exporting}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg transition flex items-center gap-3 disabled:opacity-50"
              >
                <span className="text-2xl">📚</span>
                <div>
                  <div className="font-semibold text-gray-900">All Documents</div>
                  <div className="text-xs text-gray-500">Export everything (JSON)</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('stats')}
                disabled={exporting}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg transition flex items-center gap-3 disabled:opacity-50"
              >
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold text-gray-900">Statistics Report</div>
                  <div className="text-xs text-gray-500">Analytics & insights (JSON)</div>
                </div>
              </button>

              <div className="border-t border-gray-200 my-2" />

              <div className="px-4 py-2 text-xs text-gray-500 text-center">
                💎 Premium: Export to PDF, Obsidian, Notion
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}