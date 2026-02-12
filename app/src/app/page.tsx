'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  ChatBubbleBottomCenterTextIcon,
  BookOpenIcon,
  FolderIcon,
  ChartBarIcon,
  FireIcon,
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  totalDocuments: number;
  totalWords: number;
  totalChunks: number;
  lastCaptured: number | null;
}

interface RecentDocument {
  id: string;
  title: string;
  url: string;
  word_count: number;
  created_at: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, docsRes] = await Promise.all([
        fetch('http://localhost:3001/api/stats'),
        fetch('http://localhost:3001/api/captures?limit=5'),
      ]);

      const statsData = await statsRes.json();
      const docsData = await docsRes.json();

      setStats(statsData);
      setRecentDocs(docsData.documents || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <MainLayout
      title="Dashboard"
      description="Your knowledge at a glance"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

  {/* Documents */}
  <div className="card p-6 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
    <div className="flex items-center justify-between mb-2">
      <BookOpenIcon className="w-8 h-8 opacity-80" />
      <div className="text-right">
        {loading ? (
          <>
            <div className="w-16 h-8 bg-white/20 rounded animate-pulse mb-2"></div>
            <div className="w-20 h-4 bg-white/20 rounded animate-pulse"></div>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold">
              {stats?.totalDocuments || 0}
            </div>
            <div className="text-sm opacity-80">Documents</div>
          </>
        )}
      </div>
    </div>
  </div>

  {/* Words */}
  <div className="card p-6">
    <div className="flex items-center justify-between mb-2">
      <DocumentTextIcon className="w-8 h-8 text-gray-400" />
      <div className="text-right">
        {loading ? (
          <>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-gray-900">
              {((stats?.totalWords || 0) / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-gray-600">Words</div>
          </>
        )}
      </div>
    </div>
  </div>

  {/* Chunks */}
  <div className="card p-6">
    <div className="flex items-center justify-between mb-2">
      <SparklesIcon className="w-8 h-8 text-gray-400" />
      <div className="text-right">
        {loading ? (
          <>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.totalChunks || 0}
            </div>
            <div className="text-sm text-gray-600">Chunks</div>
          </>
        )}
      </div>
    </div>
  </div>

  {/* Last Capture */}
  <div className="card p-6">
    <div className="flex items-center justify-between mb-2">
      <ClockIcon className="w-8 h-8 text-gray-400" />
      <div className="text-right">
        {loading ? (
          <>
            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          </>
        ) : (
          <>
            <div className="text-lg font-bold text-gray-900">
              {stats?.lastCaptured
                ? formatDate(stats.lastCaptured)
                : 'Never'}
            </div>
            <div className="text-sm text-gray-600">Last Capture</div>
          </>
        )}
      </div>
    </div>
  </div>

</div>


      {/* Empty State - Show when no documents */}
{!loading && stats && stats.totalDocuments === 0 && (
  <div className="card p-12 text-center mb-8">
    <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
      <SparklesIcon className="w-10 h-10 text-brand-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-3">
      Welcome to Open Context! 🎉
    </h2>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      Your personal AI-powered knowledge base. Start by uploading documents or capturing web pages.
    </p>
    <div className="flex gap-4 justify-center">
      <Link href="/upload" className="btn-primary">
        <CloudArrowUpIcon className="w-4 h-4" />
        Upload Documents
      </Link>
      <button
        onClick={() => {
          localStorage.removeItem('onboarding_completed');
          window.location.reload();
        }}
        className="btn-secondary"
      >
        Restart Tutorial
      </button>
    </div>
  </div>
)}

      {/* Quick Actions - HORIZONTAL ROW */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Semantic Search */}
          <Link 
            href="/search" 
            className="card group hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <MagnifyingGlassIcon className="w-7 h-7 text-brand-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">
                    Semantic Search
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Find anything by meaning, not just keywords. AI-powered search.
                  </p>
                  <div className="flex items-center text-brand-600 text-sm font-medium group-hover:gap-2 transition-all">
                    Try it now
                    <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-brand-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
          </Link>

          {/* Upload Files */}
          <Link 
            href="/upload" 
            className="card group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-green-100"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <CloudArrowUpIcon className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      Upload Files
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full">
                      NEW
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    PDF, DOCX, TXT - drag & drop with auto-processing and OCR.
                  </p>
                  <div className="flex items-center text-green-600 text-sm font-medium group-hover:gap-2 transition-all">
                    Upload now
                    <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
          </Link>

          {/* AI Chat */}
          <Link 
            href="/chat" 
            className="card group hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <ChatBubbleBottomCenterTextIcon className="w-7 h-7 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    AI Chat
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Ask questions about your saved content. Get instant answers.
                  </p>
                  <div className="flex items-center text-purple-600 text-sm font-medium group-hover:gap-2 transition-all">
                    Start chatting
                    <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Documents</h2>
              <Link href="/library" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                View All →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-lg" />
                ))}
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="text-center py-12">
                <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-600 mb-4">Start capturing content to see it here</p>
                <Link href="/upload" className="btn-primary">
                  Upload Your First Document
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/library/${doc.id}`}
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                  >
                    <div className="flex items-start gap-3">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 group-hover:text-brand-600 line-clamp-1 mb-1">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{doc.word_count.toLocaleString()} words</span>
                          <span>•</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Quick Links */}
        <div className="space-y-6">
          {/* Collections */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <FolderIcon className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Collections</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Organize documents into collections and folders
            </p>
            <Link href="/collections" className="btn-ghost w-full justify-center">
              Manage Collections
            </Link>
          </div>

          {/* Analytics */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Analytics</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Track your learning journey with AI insights
            </p>
            <Link href="/analytics" className="btn-ghost w-full justify-center">
              View Analytics
            </Link>
          </div>

          {/* Getting Started */}
          <div className="card p-6 bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <SparklesIcon className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Getting Started</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-brand-600">1.</span>
                <span>Install browser extension to capture web pages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600">2.</span>
                <span>Upload your existing documents (PDF, DOCX)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600">3.</span>
                <span>Use semantic search to find anything</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600">4.</span>
                <span>Chat with AI about your content</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}