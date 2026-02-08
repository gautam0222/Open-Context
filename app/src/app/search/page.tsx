'use client';

import { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10 }),
      });

      const data = await response.json();
      setResults(data.results || []);
      setSearchTime(Date.now() - startTime);

      if (data.results?.length > 0) {
        toast.success(`Found ${data.results.length} results!`);
      } else {
        toast('No results found', { icon: '🤷' });
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Semantic Search" description="Find content by meaning, not just keywords">
      {/* Search Hero */}
      <div className="max-w-3xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your knowledge base..."
              className="w-full pl-14 pr-32 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-50 transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>

          {/* Search suggestions */}
          {!hasSearched && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Try:</span>
              {['machine learning', 'productivity tips', 'startup advice'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Results Header */}
      {hasSearched && !loading && (
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {results.length > 0 ? (
              <>
                Found <span className="font-semibold text-gray-900">{results.length}</span> results in{' '}
                <span className="font-semibold text-gray-900">{searchTime}ms</span>
              </>
            ) : (
              <>No results for &quot;{query}&quot;</>
            )}
          </div>
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
              className="card p-6 hover:shadow-md transition-shadow"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/library/${result.documentId}`}
                    className="text-lg font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-1"
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

                {/* Similarity Score */}
                <div className="flex-shrink-0 text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 rounded-full">
                    <SparklesIcon className="w-4 h-4 text-brand-600" />
                    <span className="text-sm font-semibold text-brand-700">
                      {(result.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">similarity</div>
                </div>
              </div>

              {/* Content Preview */}
              <p className="text-gray-700 leading-relaxed mb-4">{result.content}</p>

              {/* Footer */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  Chunk #{result.chunkIndex + 1}
                </span>
                <span>•</span>
                <span>Rank #{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !hasSearched && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-8 h-8 text-brand-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Semantic Search</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Search by meaning, not just keywords. Our AI understands context and finds relevant content even if it doesn't match exact words.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto text-left">
            <div>
              <div className="font-semibold text-gray-900 mb-1">Natural Language</div>
              <div className="text-sm text-gray-600">
                Ask questions like you would to a person
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Context-Aware</div>
              <div className="text-sm text-gray-600">
                Understands meaning and relationships
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Lightning Fast</div>
              <div className="text-sm text-gray-600">
                Results in under a second
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="card p-12 text-center">
          <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-6">
            Try different keywords or capture more content to expand your knowledge base.
          </p>
          <Link href="/library" className="btn-primary">
            Browse Library
          </Link>
        </div>
      )}
    </MainLayout>
  );
}