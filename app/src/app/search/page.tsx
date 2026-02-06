'use client';
import toast from 'react-hot-toast';

import { useState } from 'react';

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

  const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!query.trim()) return;

  setLoading(true);
  const startTime = Date.now();

  const searchPromise = fetch('http://localhost:3001/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 10 }),
  }).then((res) => res.json());

  toast.promise(searchPromise, {
    loading: 'Searching...',
    success: (data) => `Found ${data.results?.length || 0} results!`,
    error: 'Search failed',
  });

  try {
    const data = await searchPromise;
    setResults(data.results || []);
    setSearchTime(Date.now() - startTime);
  } catch (error) {
    console.error('Search failed:', error);
    setResults([]);
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-white text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🔍 Semantic Search</h1>
          <p className="opacity-90">Search by meaning, not just keywords</p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your knowledge graph..."
                className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? '🔄 Searching...' : '🔍 Search'}
              </button>
            </div>
          </div>
        </form>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="text-white text-sm">
              Found <strong>{results.length}</strong> results in{' '}
              <strong>{searchTime}ms</strong>
            </div>

            {results.map((result, index) => (
              <div
                key={result.chunkId}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {result.documentTitle || 'Untitled'}
                    </h3>
                    <a
                      href={result.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {result.documentUrl}
                    </a>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-xs text-gray-500 mb-1">Similarity</div>
                    <div className="text-xl font-bold text-primary-600">
                      {(result.similarity * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed">
                  {result.content}
                </p>

                <div className="mt-4 flex gap-4 text-xs text-gray-500">
                  <span>Chunk #{result.chunkIndex + 1}</span>
                  <span>•</span>
                  <span>Rank #{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🤷</div>
            <p className="text-xl">No results found for &quot;{query}&quot;</p>
            <p className="mt-2 opacity-75">Try a different search term</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <a href="/" className="text-white hover:underline">
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}