'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  SparklesIcon,
  FireIcon,
  TrophyIcon,
  BookOpenIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface DigestItem {
  type: string;
  title: string;
  content: string;
  icon: string;
  priority: number;
}

export default function DigestPage() {
  const [digest, setDigest] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDigest();
  }, []);

  const loadDigest = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/digest');
      const data = await response.json();
      setDigest(data.digest || []);
    } catch (error) {
      console.error('Failed to load digest:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      summary: 'from-blue-500 to-blue-600',
      insight: 'from-purple-500 to-purple-600',
      recommendation: 'from-green-500 to-green-600',
      streak: 'from-orange-500 to-orange-600',
      achievement: 'from-amber-500 to-amber-600',
    };
    return colors[type] || colors.summary;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      summary: <SparklesIcon className="w-6 h-6" />,
      insight: <TrophyIcon className="w-6 h-6" />,
      recommendation: <BookOpenIcon className="w-6 h-6" />,
      streak: <FireIcon className="w-6 h-6" />,
      achievement: <TrophyIcon className="w-6 h-6" />,
    };
    return icons[type] || icons.summary;
  };

  return (
    <MainLayout
      title="Daily Digest"
      description={`Your personalized learning summary for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
      headerActions={
        <button onClick={loadDigest} className="btn-secondary" disabled={loading}>
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      }
    >
      <div className="w-full">
        {/* Hero Section */}
        <div className="card p-8 mb-6 bg-gradient-to-r from-brand-500 to-purple-500 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Good morning! ☀️</h2>
              <p className="text-white/90">Here's your personalized learning digest</p>
            </div>
          </div>
        </div>

        {/* Digest Items */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-6 w-32 mb-4"></div>
                <div className="skeleton h-20 w-full"></div>
              </div>
            ))}
          </div>
        ) : digest.length === 0 ? (
          <div className="card p-12 text-center">
            <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No digest yet</h3>
            <p className="text-gray-600">Start capturing content to get personalized insights!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {digest.map((item, index) => (
              <div
                key={index}
                className="card p-6 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(item.type)} rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{item.content}</p>
                    
                    {/* Action Button */}
                    {item.type === 'recommendation' && (
                      <button className="mt-4 text-sm text-brand-600 font-semibold hover:text-brand-700 transition">
                        Explore →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-center">
              <BookOpenIcon className="w-6 h-6 text-brand-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Browse Library</div>
            </button>
            <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-center">
              <TrophyIcon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium">View Goals</div>
            </button>
            <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-center">
              <FireIcon className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Keep Streak</div>
            </button>
            <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-center">
              <SparklesIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Discover</div>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}