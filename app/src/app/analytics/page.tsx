'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  ChartBarIcon,
  BookOpenIcon,
  FireIcon,
  TrophyIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  summary: {
    totalDocuments: number;
    totalWords: number;
    avgWordsPerDoc: number;
    streak: number;
    goalsCompleted: number;
    goalsActive: number;
    achievements: number;
  };
  charts: {
    docsByDay: Array<{ date: string; count: number }>;
    wordsByDay: Array<{ date: string; words: number }>;
    topCollections: Array<{ id: string; name: string; count: number }>;
    activeDays: Array<{ day: string; count: number }>;
  };
  timeRange: string;
}

interface ReadingTime {
  totalWords: number;
  hours: number;
  minutes: number;
  formatted: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [readingTime, setReadingTime] = useState<ReadingTime | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('week');

  useEffect(() => {
    loadAnalytics();
    loadReadingTime();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/analytics/enhanced?range=${timeRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReadingTime = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/analytics/reading-time');
      const result = await response.json();
      setReadingTime(result);
    } catch (error) {
      console.error('Failed to load reading time:', error);
    }
  };

  return (
    <MainLayout
      title="Analytics"
      description="Track your learning progress"
    >
      <div className="w-full space-y-6">
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === range
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'week' && 'This Week'}
              {range === 'month' && 'This Month'}
              {range === 'year' && 'This Year'}
              {range === 'all' && 'All Time'}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        {loading ? (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="card p-6">
        <div className="skeleton h-20 w-full"></div>
      </div>
    ))}
  </div>
) : data ? (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="card p-6 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
      <div className="flex items-center justify-between mb-2">
        <DocumentTextIcon className="w-8 h-8 opacity-80" />
        <span className="text-3xl font-bold">{data.summary?.totalDocuments || 0}</span>
      </div>
      <div className="text-sm opacity-90">Documents</div>
    </div>

            <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between mb-2">
                <BookOpenIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">
                  {(data.summary.totalWords / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="text-sm opacity-90">Words Read</div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <div className="flex items-center justify-between mb-2">
                <FireIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{data.summary.streak}</span>
              </div>
              <div className="text-sm opacity-90">Day Streak</div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrophyIcon className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{data.summary.achievements}</span>
              </div>
              <div className="text-sm opacity-90">Achievements</div>
            </div>
          </div>
        ) : null}

        {/* Reading Time */}
        {readingTime && (
          <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{readingTime.formatted}</h3>
                <p className="text-gray-600">Total estimated reading time</p>
                <p className="text-sm text-gray-500 mt-1">
                  Based on {readingTime.totalWords.toLocaleString()} words at 200 WPM
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Documents Timeline */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Documents Over Time</h3>
              <div className="space-y-2">
                {data.charts.docsByDay.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">No data for this period</p>
                ) : (
                  data.charts.docsByDay.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="text-sm text-gray-600 w-24">{item.date}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-brand-600 h-full flex items-center justify-end pr-2 text-white text-xs font-semibold"
                          style={{
                            width: `${Math.min((item.count / Math.max(...data.charts.docsByDay.map(d => d.count))) * 100, 100)}%`,
                          }}
                        >
                          {item.count}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Collections */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Top Collections</h3>
              <div className="space-y-3">
                {data.charts.topCollections.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">No collections yet</p>
                ) : (
                  data.charts.topCollections.map((collection, index) => (
                    <div key={collection.id} className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-gray-300 w-8">#{index + 1}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{collection.name}</div>
                        <div className="text-sm text-gray-600">{collection.count} documents</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Days */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Most Active Days</h3>
              <div className="space-y-2">
                {data.charts.activeDays.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">No activity yet</p>
                ) : (
                  data.charts.activeDays.map((day) => (
                    <div key={day.day} className="flex items-center gap-3">
                      <div className="text-sm text-gray-600 w-12">{day.day}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-purple-600 h-full flex items-center justify-end pr-2 text-white text-xs font-semibold"
                          style={{
                            width: `${Math.min((day.count / Math.max(...data.charts.activeDays.map(d => d.count))) * 100, 100)}%`,
                          }}
                        >
                          {day.count}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Goals Progress */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Learning Goals</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="text-2xl font-bold text-green-600">{data.summary.goalsCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active</span>
                  <span className="text-2xl font-bold text-brand-600">{data.summary.goalsActive}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">Average Words per Document</div>
                  <div className="text-3xl font-bold text-gray-900">{data.summary.avgWordsPerDoc}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}