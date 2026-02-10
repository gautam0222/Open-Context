'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import {
  FireIcon,
  BookOpenIcon,
  ClockIcon,
  TrophyIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface Insight {
  type: string;
  title: string;
  description: string;
  data: any;
  importance: number;
}

interface Timeline {
  date: string;
  documents: Array<{
    id: string;
    title: string;
    url: string;
    word_count: number;
  }>;
  totalWords: number;
}

interface ReadingStats {
  totalWords: number;
  totalDocs: number;
  avgWords: number;
  streak: number;
  wordsPerDay: number;
  readingHours: number;
}

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [timeline, setTimeline] = useState<Timeline[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [insightsRes, timelineRes, statsRes] = await Promise.all([
        fetch('http://localhost:3001/api/insights'),
        fetch('http://localhost:3001/api/timeline'),
        fetch('http://localhost:3001/api/stats/reading'),
      ]);

      const insightsData = await insightsRes.json();
      const timelineData = await timelineRes.json();
      const statsData = await statsRes.json();

      setInsights(insightsData.insights || []);
      setTimeline(timelineData.timeline || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <MainLayout title="Analytics" description="Insights about your learning journey">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing your knowledge...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Analytics"
      description="Insights about your learning journey"
      headerActions={
        <button onClick={loadData} className="btn-secondary">
          <ArrowTrendingUpIcon className="w-4 h-4" />
          Refresh
        </button>
      }
    >
      {/* Hero Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FireIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="text-sm opacity-90">Current Streak</div>
                <div className="text-3xl font-bold">{stats.streak} days</div>
              </div>
            </div>
            <div className="text-sm opacity-75">
              {stats.streak >= 7 ? "You're crushing it! 🔥" : "Keep going!"}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                <BookOpenIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Knowledge</div>
                <div className="text-3xl font-bold text-gray-900">
                  {(stats.totalWords / 1000).toFixed(1)}K
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">{stats.totalDocs} documents captured</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <ClockIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Reading Time</div>
                <div className="text-3xl font-bold text-gray-900">{stats.readingHours}h</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">~{stats.wordsPerDay} words/day</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <TrophyIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Article</div>
                <div className="text-3xl font-bold text-gray-900">{stats.avgWords}</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">words per document</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <SparklesIcon className="w-6 h-6 text-brand-600" />
              <h2 className="text-xl font-bold text-gray-900">AI Insights</h2>
            </div>

            {insights.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Capture more documents to unlock insights!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl border-l-4 border-brand-600"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                        <p className="text-gray-700 text-sm">{insight.description}</p>
                      </div>
                      <div className="text-2xl">
                        {insight.type === 'reading_streak' && '🔥'}
                        {insight.type === 'learning_pattern' && '📚'}
                        {insight.type === 'frequent_topic' && '⭐'}
                        {insight.type === 'knowledge_gap' && '💡'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <CalendarDaysIcon className="w-6 h-6 text-brand-600" />
              <h2 className="text-xl font-bold text-gray-900">Learning Timeline</h2>
            </div>

            {timeline.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Your learning journey will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {timeline.slice(0, 10).map((day, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-2 w-3 h-3 bg-brand-600 rounded-full"></div>
                    {idx < timeline.length - 1 && (
                      <div className="absolute left-[5px] top-5 bottom-0 w-0.5 bg-brand-200"></div>
                    )}

                    <div className="ml-6">
                      <div className="flex items-baseline gap-3 mb-2">
                        <div className="text-sm font-semibold text-brand-600">
                          {formatDate(day.date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {day.documents.length} {day.documents.length === 1 ? 'capture' : 'captures'} • {day.totalWords.toLocaleString()} words
                        </div>
                      </div>

                      <div className="space-y-2">
                        {day.documents.map(doc => (
                          <Link
                            key={doc.id}
                            href={`/library/${doc.id}`}
                            className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                          >
                            <div className="font-medium text-gray-900 group-hover:text-brand-600 text-sm line-clamp-1">
                              {doc.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {doc.word_count.toLocaleString()} words
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {timeline.length > 10 && (
                  <div className="text-center pt-4">
                    <Link href="/library" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                      View all captures →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/search" className="block p-3 bg-brand-50 hover:bg-brand-100 rounded-lg transition group">
                <div className="font-medium text-brand-700 group-hover:text-brand-800 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5" />
                  Semantic Search
                </div>
                <div className="text-xs text-brand-600 mt-1">Find by meaning</div>
              </Link>

              <Link href="/library" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition group">
                <div className="font-medium text-gray-700 group-hover:text-gray-900 flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5" />
                  Browse Library
                </div>
                <div className="text-xs text-gray-500 mt-1">View all documents</div>
              </Link>
            </div>
          </div>

          {/* Achievements */}
          {stats && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Achievements</h3>
              <div className="space-y-3">
                {stats.totalDocs >= 10 && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                    <div className="text-2xl">🏆</div>
                    <div>
                      <div className="font-medium text-amber-900 text-sm">Knowledge Collector</div>
                      <div className="text-xs text-amber-700">10+ documents captured</div>
                    </div>
                  </div>
                )}

                {stats.streak >= 7 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl">🔥</div>
                    <div>
                      <div className="font-medium text-orange-900 text-sm">Week Warrior</div>
                      <div className="text-xs text-orange-700">7-day streak!</div>
                    </div>
                  </div>
                )}

                {stats.totalWords >= 10000 && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl">📚</div>
                    <div>
                      <div className="font-medium text-purple-900 text-sm">Voracious Reader</div>
                      <div className="text-xs text-purple-700">10K+ words captured</div>
                    </div>
                  </div>
                )}

                {stats.totalDocs < 10 && stats.streak < 7 && stats.totalWords < 10000 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Keep capturing to unlock achievements! 🎯
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}