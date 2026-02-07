'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalDocuments: number;
  totalWords: number;
  averageWords: number;
  totalChunks: number;
}

interface RecentDocument {
  id: string;
  title: string;
  url: string;
  created_at: number;
  word_count: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load stats
      const statsResponse = await fetch('http://localhost:3001/api/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load recent documents
      const docsResponse = await fetch('http://localhost:3001/api/captures');
      const docsData = await docsResponse.json();
      setRecentDocs((docsData.documents || []).slice(0, 5));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500">
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
            🧠 Open Context
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8">
            Your Personal AI-Powered Knowledge Graph
          </p>

          {/* Quick Stats */}
          {stats && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
    {[
      { value: stats.totalDocuments, label: 'Documents', icon: '📚' },
      { value: `${(stats.totalWords / 1000).toFixed(1)}K`, label: 'Words', icon: '📝' },
      { value: stats.totalChunks, label: 'Chunks', icon: '🧩' },
      { value: stats.averageWords, label: 'Avg Words', icon: '📊' },
    ].map((stat, index) => (
      <div
        key={stat.label}
        className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover-lift animate-scale-in"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="text-2xl mb-2">{stat.icon}</div>
        <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
        <div className="text-sm opacity-80">{stat.label}</div>
      </div>
    ))}
  </div>
)}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <Link
    href="/search"
    className="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-opacity-90 transition shadow-xl hover:shadow-2xl hover:-translate-y-1 transform"
  >
    🔍 Semantic Search
  </Link>
  <Link
    href="/documents"
    className="px-8 py-4 bg-white/20 backdrop-blur text-white rounded-xl font-bold text-lg hover:bg-white/30 transition border border-white/30 hover:shadow-xl hover:-translate-y-1 transform"
  >
    📚 Browse Library
  </Link>
  <Link
    href="/settings"
    className="px-8 py-4 bg-white/20 backdrop-blur text-white rounded-xl font-bold text-lg hover:bg-white/30 transition border border-white/30 hover:shadow-xl hover:-translate-y-1 transform"
  >
    ⚙️ Settings
  </Link>
          </div>
        </div>

        {/* Recent Documents */}
        {recentDocs.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📄</span>
                Recently Captured
              </h2>
              <div className="space-y-3">
                {recentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition cursor-pointer border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold mb-1 truncate">
                          {doc.title || 'Untitled'}
                        </h3>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-white/60 hover:text-white/80 truncate block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {doc.url}
                        </a>
                      </div>
                      <div className="text-right text-white/60 text-sm whitespace-nowrap">
                        <div>{formatDate(doc.created_at)}</div>
                        {doc.word_count && (
                          <div className="text-xs mt-1">
                            {doc.word_count.toLocaleString()} words
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/documents"
                className="block text-center mt-4 text-white/80 hover:text-white text-sm font-medium"
              >
                View all documents →
              </Link>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">Semantic Search</h3>
            <p className="text-white/80 text-sm">
              Find content by meaning, not just keywords. Powered by AI embeddings running
              100% locally.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-3">🕸️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Knowledge Graph</h3>
            <p className="text-white/80 text-sm">
              Visualize connections between concepts and discover new insights across your
              saved content.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-xl font-semibold text-white mb-2">Privacy First</h3>
            <p className="text-white/80 text-sm">
              100% local-first. Your data never leaves your device. Optional cloud sync
              available.
            </p>
          </div>
        </div>

        {/* How to Use */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              🚀 Getting Started
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-white">
              <div className="text-center">
                <div className="text-4xl mb-3">1️⃣</div>
                <h3 className="font-semibold mb-2">Capture</h3>
                <p className="text-sm text-white/80">
                  Right-click any webpage and select &quot;Add to Open Context&quot;
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">2️⃣</div>
                <h3 className="font-semibold mb-2">Search</h3>
                <p className="text-sm text-white/80">
                  Use semantic search to find content by meaning, not just keywords
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">3️⃣</div>
                <h3 className="font-semibold mb-2">Discover</h3>
                <p className="text-sm text-white/80">
                  Explore connections in your knowledge graph and uncover insights
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Version */}

        <div className="mt-12 text-center text-white/60 text-sm">
          <p>Open Context v0.2.0 • Made with 💜 by You</p>
          <p className="mt-1">
            {stats
              ? `${stats.totalDocuments} documents indexed • ${stats.totalChunks} chunks embedded`
              : 'Loading...'}
          </p>
        </div>
      </div>
    </main>
  );
}