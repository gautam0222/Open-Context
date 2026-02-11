'use client';
import { FolderPlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

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

type SortOption = 'date' | 'title' | 'words';
type ViewMode = 'grid' | 'list';

export default function LibraryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [showActions, setShowActions] = useState<string | null>(null);
  const [allCollections, setAllCollections] = useState<any[]>([]);

  useEffect(() => {
    loadDocuments();
    loadCollections();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/captures');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/collections');
    const data = await response.json();
    setAllCollections(data.collections || []);
  } catch (error) {
    console.error('Failed to load collections:', error);
  }
};

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.title}"?\n\nThis will permanently delete the document and all its chunks.`)) {
      return;
    }

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
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAddToCollection = async (documentId: string, collectionId: string) => {
  try {
    const response = await fetch(
      `http://localhost:3001/api/collections/${collectionId}/documents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId }),
      }
    );

    if (!response.ok) throw new Error('Failed to add');

    toast.success('Added to collection!');
  } catch (error) {
    console.error('Add to collection error:', error);
    toast.error('Failed to add to collection');
  }
};

  const filteredDocuments = documents
    .filter((doc) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        doc.title?.toLowerCase().includes(query) ||
        doc.url?.toLowerCase().includes(query) ||
        doc.site_name?.toLowerCase().includes(query) ||
        doc.author?.toLowerCase().includes(query)
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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <MainLayout
      title="Library"
      description={`${documents.length} documents in your knowledge base`}
      headerActions={
        <button onClick={loadDocuments} className="btn-secondary">
          <ArrowsUpDownIcon className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      }
    >
      {/* Toolbar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input w-40"
            >
              <option value="date">Newest first</option>
              <option value="title">Title A-Z</option>
              <option value="words">Word count</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-40 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Start capturing web pages using the browser extension to build your knowledge base.
          </p>
          <button className="btn-primary">
            Install Extension
          </button>
        </div>
      )}

      {/* Grid View */}
      {!loading && filteredDocuments.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <DocumentCard
  key={doc.id}
  doc={doc}
  onDelete={() => handleDelete(doc)}
  onAddToCollection={handleAddToCollection}
  formatDate={formatDate}
  getDomain={getDomain}
/>

          ))}
        </div>
      )}

      {/* List View */}
      {!loading && filteredDocuments.length > 0 && viewMode === 'list' && (
        <div className="card divide-y divide-gray-200">
          {filteredDocuments.map((doc) => (
            <DocumentListItem
              key={doc.id}
              doc={doc}
              onDelete={() => handleDelete(doc)}
              formatDate={formatDate}
              getDomain={getDomain}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && documents.length > 0 && filteredDocuments.length === 0 && (
        <div className="card p-12 text-center">
          <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">
            No documents match &quot;{searchQuery}&quot;
          </p>
        </div>
      )}
    </MainLayout>
  );
}

// Document Card Component (Grid)
function DocumentCard({
  doc,
  onDelete,
  onAddToCollection,
  formatDate,
  getDomain,
}: {
  doc: Document;
  onDelete: () => void;
  onAddToCollection: (docId: string, collectionId: string) => void;
  formatDate: (ts: number) => string;
  getDomain: (url: string) => string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="card p-5 group relative hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              {doc.site_name || getDomain(doc.url)}
            </span>
            <span className="text-xs text-gray-500">{formatDate(doc.created_at)}</span>
          </div>
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-brand-600 transition-colors">
            {doc.title || 'Untitled'}
          </h3>
        </div>

        <button
  onClick={(e) => {
    e.preventDefault();
    // Show collections dropdown
    const collectionId = prompt('Enter collection ID (or visit Collections page):');
    if (collectionId) {
      onAddToCollection(doc.id, collectionId);
    }
  }}
  className="p-2 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-gray-100"
  title="Add to collection"
>
  <FolderPlusIcon className="w-4 h-4" />
</button>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <Link
                  href={`/library/${doc.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <EyeIcon className="w-4 h-4" />
                  View Card
                </Link>
                    <a
                  href={`http://localhost:3001/api/export/documents/${doc.id}/markdown`}
                  download
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setShowMenu(false);
                    toast.success('Downloading...');
                  }}
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 w-full"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Excerpt */}
      {doc.excerpt && (
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">{doc.excerpt}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {doc.author && <span className="truncate">By {doc.author}</span>}
        {doc.word_count && (
          <span className="flex-shrink-0">{doc.word_count.toLocaleString()} words</span>
        )}
      </div>

      {/* Quick Actions (on hover) */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
          <Link href={`/library/${doc.id}`} className="flex-1 btn-primary text-center text-sm">
            <EyeIcon className="w-4 h-4" />
            View
          </Link>
            <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            Open →
          </a>
        </div>
      </div>
    </div>
  );
}

// Document List Item Component
function DocumentListItem({
  doc,
  onDelete,
  formatDate,
  getDomain,
}: {
  doc: Document;
  onDelete: () => void;
  formatDate: (ts: number) => string;
  getDomain: (url: string) => string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/library/${doc.id}`}
            className="font-semibold text-gray-900 hover:text-brand-600 transition-colors truncate"
          >
            {doc.title || 'Untitled'}
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{doc.site_name || getDomain(doc.url)}</span>
          <span>•</span>
          <span>{formatDate(doc.created_at)}</span>
          {doc.author && (
            <>
              <span>•</span>
              <span>By {doc.author}</span>
            </>
          )}
          {doc.word_count && (
            <>
              <span>•</span>
              <span>{doc.word_count.toLocaleString()} words</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={`/library/${doc.id}`} className="btn-ghost text-sm">
          View
        </Link>
        <a
          href={`http://localhost:3001/api/export/documents/${doc.id}/markdown`}
          download
          className="btn-ghost text-sm"
          onClick={() => toast.success('Downloading...')}
        >
          Download
        </a>
        <button onClick={onDelete} className="btn-ghost text-sm text-error-600 hover:bg-error-50">
          Delete
        </button>
      </div>
    </div>
  );
}