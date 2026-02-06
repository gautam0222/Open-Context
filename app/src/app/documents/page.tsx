'use client';
import ExportMenu from '@/components/ExportMenu';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  url: string;
  title: string;
  excerpt: string | null;
  author: string | null;
  site_name: string | null;
  word_count: number | null;
  created_at: number;
}

interface Stats {
  totalDocuments: number;
  totalWords: number;
  totalChunks: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'words'>('date');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
    loadStats();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/captures');
      const data = await response.json();
      setDocuments(data.documents || []);
      toast.success('Documents loaded!');
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.title}"?\n\nThis will permanently delete the document and all its chunks.`)) {
      return;
    }

    setDeletingId(doc.id);
    const deletePromise = fetch(`http://localhost:3001/api/documents/${doc.id}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting...',
      success: 'Document deleted!',
      error: 'Failed to delete',
    });

    try {
      const response = await deletePromise;
      if (response.ok) {
        // Remove from UI
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        // Reload stats
        loadStats();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocuments = documents
    .filter((doc) => {
      if (!searchFilter) return true;
      const search = searchFilter.toLowerCase();
      return (
        doc.title?.toLowerCase().includes(search) ||
        doc.url?.toLowerCase().includes(search) ||
        doc.site_name?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date') return b.created_at - a.created_at;
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'words') return (b.word_count || 0) - (a.word_count || 0);
      return 0;
    });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">📚 Document Library</h1>
              <p className="text-white/80">
                {stats && (
                  <>
                    {stats.totalDocuments} documents • {stats.totalWords.toLocaleString()} words
                    • {stats.totalChunks} chunks
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-3">
  <ExportMenu />
  <button
    onClick={() => {
      loadDocuments();
      loadStats();
    }}
    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition"
    disabled={loading}
  >
    🔄 Refresh
  </button>
  <Link
    href="/"
    className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition"
  >
    ← Home
  </Link>
</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="🔍 Search documents..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="flex-1 min-w-[300px] px-4 py-2 bg-white/20 text-white placeholder-white/60 rounded-lg border border-white/30 focus:outline-none focus:border-white/50"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:border-white/50"
            >
              <option value="date" className="text-gray-900">
                Sort: Newest
              </option>
              <option value="title" className="text-gray-900">
                Sort: Title
              </option>
              <option value="words" className="text-gray-900">
                Sort: Word Count
              </option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-white py-12">
            <div className="text-6xl mb-4 animate-pulse">⏳</div>
            <p className="text-xl">Loading documents...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && documents.length === 0 && (
          <div className="text-center text-white py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl mb-2">No documents yet</p>
            <p className="opacity-75">Start capturing pages using the browser extension!</p>
          </div>
        )}

        {/* Document Grid */}
        {!loading && filteredDocuments.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className="p-6">
                  {/* Site Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                      {doc.site_name || getDomainFromUrl(doc.url)}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(doc.created_at)}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {doc.title || 'Untitled'}
                  </h3>

                  {/* Excerpt */}
                  {doc.excerpt && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{doc.excerpt}</p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    {doc.author && <span>✍️ {doc.author}</span>}
                    {doc.word_count && <span>{doc.word_count.toLocaleString()} words</span>}
                  </div>

                  {/* Actions */}
                  {/* Actions */}
<div className="flex gap-2">
  <a
    href={doc.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-center rounded-lg font-medium transition text-sm"
  >
    🔗 Open
  </a>
  <a
    href={`http://localhost:3001/api/export/documents/${doc.id}/markdown`}
    download
    className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition text-sm"
    title="Download as Markdown"
    onClick={() => toast.success('Downloading...')}
  >
    📄
  </a>
  <button
    onClick={() => handleDelete(doc)}
    disabled={deletingId === doc.id}
    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition text-sm disabled:opacity-50"
    title="Delete document"
  >
    {deletingId === doc.id ? '⏳' : '🗑️'}
  </button>
</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filtered Empty State */}
        {!loading && documents.length > 0 && filteredDocuments.length === 0 && (
          <div className="text-center text-white py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl">No documents match &quot;{searchFilter}&quot;</p>
          </div>
        )}
      </div>
    </main>
  );
}