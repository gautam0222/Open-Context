'use client';

import MainLayout from '@/components/Layout/MainLayout';
import KeyboardHint from '@/components/UI/KeyboardHint';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import AdvancedFilters, { SearchFilters } from '@/components/Search/AdvancedFilters';

interface SearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentUrl: string;
  content: string;
  similarity: number;
  chunkIndex: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: 'all',
    collections: [],
    fileTypes: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    if (query.trim()) {
      handleSearch();
    }
  }, [filters]);

  const loadCollections = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/collections');
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        dateRange: filters.dateRange,
        collections: filters.collections.join(','),
        fileTypes: filters.fileTypes.join(','),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const response = await fetch(`http://localhost:3001/api/search?${params}`);
      const data = await response.json();
      setResults(data.results || []);
      setSearchTime(data.searchTime || 0);
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      title="Search"
      description="Find anything in your knowledge base"
    >
      <div className="w-full max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="card p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search documents, notes, collections..."
                className="input w-full pl-10"
                autoFocus
              />
            </div>
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              collections={collections}
            />
            <button onClick={handleSearch} className="btn-primary">
              Search
            </button>
          </div>

          {/* Active Filters Display */}
          {(filters.dateRange !== 'all' || filters.collections.length > 0 || filters.fileTypes.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filters.dateRange !== 'all' && (
                <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-medium">
                  📅 {filters.dateRange}
                </span>
              )}
              {filters.collections.map(id => {
                const collection = collections.find(c => c.id === id);
                return collection ? (
                  <span key={id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    📁 {collection.name}
                  </span>
                ) : null;
              })}
              {filters.fileTypes.map(type => (
                <span key={type} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  📄 {type}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Results Header */}
        {hasSearched && !loading && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              {results.length > 0 ? (
                <>
                  Found <span className="font-semibold text-gray-900">{results.length}</span> results for &quot;{query}&quot; in{' '}
                  <span className="font-semibold text-gray-900">{searchTime}ms</span>
                </>
              ) : (
                <>No results found for &quot;{query}&quot;</>
              )}
            </div>

            {results.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSearch}
                  className="btn-ghost text-sm"
                  disabled={loading}
                >
                  <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-32 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={result.chunkId}
                className="card p-6 hover:shadow-md transition-all duration-200 animate-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/library/${result.documentId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-1 block"
                    >
                      {result.documentTitle || 'Untitled'}
                    </Link>
                    <a
                      href={result.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-brand-600 truncate block mt-1"
                    >
                      {result.documentUrl}
                    </a>
                  </div>

                  {/* Similarity Badge */}
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 rounded-full">
                      <SparklesIcon className="w-4 h-4 text-brand-600" />
                      <span className="text-sm font-semibold text-brand-700">
                        {(result.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 text-right mt-1">match</div>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="bg-gray-50 border-l-4 border-brand-500 p-4 rounded-r-lg mb-4">
                  <p className="text-gray-700 leading-relaxed">{result.content}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <DocumentTextIcon className="w-4 h-4" />
                      Chunk #{result.chunkIndex + 1}
                    </span>
                    <span>•</span>
                    <span>Rank #{index + 1}</span>
                  </div>

                  <Link
                    href={`/library/${result.documentId}`}
                    className="text-brand-600 hover:text-brand-700 font-medium"
                  >
                    View full document →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !hasSearched && (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <SparklesIcon className="w-10 h-10 text-brand-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Semantic Search</h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Search by meaning, not just keywords. Our AI understands context and finds relevant content even if it doesn't match exact words.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
              <div className="p-6 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <SparklesIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="font-semibold text-gray-900 mb-2">Natural Language</div>
                <div className="text-sm text-gray-600">
                  Ask questions like you would to a person - no need for exact keywords
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="font-semibold text-gray-900 mb-2">Context-Aware</div>
                <div className="text-sm text-gray-600">
                  Understands meaning and relationships between concepts
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <ClockIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="font-semibold text-gray-900 mb-2">Lightning Fast</div>
                <div className="text-sm text-gray-600">
                  Results in milliseconds, even with thousands of documents
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
              <div className="text-sm text-blue-800">
                <strong>💡 Pro Tip:</strong> Try searching for concepts or questions, not just keywords. For example: "how to be productive" instead of just "productivity"
              </div>
            </div>
            {/* Keyboard Shortcut Hint */}
<div className="mt-6 flex justify-center">
  <KeyboardHint keys="⌘ + /" action="Quick search from anywhere" />
</div>

          </div>
        )}

        {/* No Results */}
        {!loading && hasSearched && results.length === 0 && (
          <div className="card p-12 text-center">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No documents match &quot;{query}&quot;. Try different keywords or capture more content related to this topic.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setQuery('');
                  setHasSearched(false);
                  setResults([]);
                }}
                className="btn-secondary"
              >
                Clear Search
              </button>
              <Link href="/library" className="btn-primary">
                Browse Library
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}