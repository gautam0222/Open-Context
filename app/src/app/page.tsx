'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  totalDocuments: number;
  totalWords: number;
  totalChunks: number;
  averageWords: number;
}

interface RecentDocument {
  id: string;
  title: string;
  url: string;
  created_at: number;
  word_count: number;
  site_name: string | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, docsRes] = await Promise.all([
        fetch('http://localhost:3001/api/stats'),
        fetch('http://localhost:3001/api/captures'),
      ]);

      const statsData = await statsRes.json();
      const docsData = await docsRes.json();

      setStats(statsData);
      setRecentDocs(docsData.documents?.slice(0, 5) || []);
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
    <MainLayout
      title="Dashboard"
      description="Welcome back! Here's what's happening with your knowledge base."
      headerActions={
        <Link href="/library" className="btn-primary">
          <DocumentTextIcon className="w-4 h-4" />
          <span>View Library</span>
        </Link>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<DocumentTextIcon className="w-6 h-6" />}
          label="Total Documents"
          value={stats?.totalDocuments || 0}
          trend="+12% this month"
          loading={loading}
        />
        <StatCard
          icon={<FolderIcon className="w-6 h-6" />}
          label="Total Words"
          value={stats ? `${(stats.totalWords / 1000).toFixed(1)}K` : '0'}
          trend={`${stats?.averageWords || 0} avg per doc`}
          loading={loading}
        />
        <StatCard
          icon={<SparklesIcon className="w-6 h-6" />}
          label="Embeddings"
          value={stats?.totalChunks || 0}
          trend="384-dimensional"
          loading={loading}
        />
        <StatCard
          icon={<ClockIcon className="w-6 h-6" />}
          label="Reading Time"
          value={stats ? `${Math.round(stats.totalWords / 200)}m` : '0m'}
          trend="Based on 200 wpm"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Captures</h2>
              <Link href="/library" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-lg" />
                ))}
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No documents yet</p>
                <p className="text-sm text-gray-400">
                  Start capturing pages using the browser extension
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/library/${doc.id}`}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
                      <DocumentTextIcon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                        {doc.title || 'Untitled'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {doc.site_name || new URL(doc.url).hostname} • {formatDate(doc.created_at)}
                      </p>
                    </div>
                    {doc.word_count && (
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        {doc.word_count.toLocaleString()} words
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Search Card */}
          <Link href="/search" className="card p-6 hover:shadow-md transition-shadow block group">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
              <MagnifyingGlassIcon className="w-6 h-6 text-brand-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Semantic Search</h3>
            <p className="text-sm text-gray-600">
              Find content by meaning, not just keywords
            </p>
          </Link>

          {/* AI Chat Card */}
          <div className="card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-bl-lg">
              PRO
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <SparklesIcon className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Chat</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ask questions about your captured content
            </p>
            <Link href="/settings" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Upgrade to unlock →
            </Link>
          </div>

          {/* Stats Card */}
          <div className="card p-6 bg-gradient-to-br from-brand-50 to-white">
            <div className="flex items-center gap-2 mb-3">
              <ArrowTrendingUpIcon className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold text-gray-900">This Month</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Documents added</span>
                <span className="font-medium text-gray-900">{stats?.totalDocuments || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Words captured</span>
                <span className="font-medium text-gray-900">{stats?.totalWords.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Reading time</span>
                <span className="font-medium text-gray-900">
                  {stats ? `${Math.round(stats.totalWords / 200)}m` : '0m'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  trend,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend: string;
  loading: boolean;
}) {
  if (loading) {
    return <div className="card p-6"><div className="skeleton h-20 rounded" /></div>;
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600">
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{trend}</div>
    </div>
  );
}