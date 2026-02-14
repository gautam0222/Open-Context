'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { TrophyIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  coin_reward: number;
  rarity: string;
  unlocked?: boolean;
  unlocked_at?: number;
  progress?: number;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/achievements');
      const data = await response.json();
      setAchievements(data.achievements || []);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-gray-100 text-gray-700 border-gray-300',
      rare: 'bg-blue-100 text-blue-700 border-blue-300',
      epic: 'bg-purple-100 text-purple-700 border-purple-300',
      legendary: 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 border-amber-300',
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBadge = (rarity: string) => {
    const badges: Record<string, string> = {
      common: '⚪ Common',
      rare: '🔵 Rare',
      epic: '🟣 Epic',
      legendary: '🟡 Legendary',
    };
    return badges[rarity] || badges.common;
  };

  const categories = ['all', 'beginner', 'progress', 'social', 'milestone', 'streak'];
  const filteredAchievements = filter === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === filter);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <MainLayout
      title="Achievements"
      description="Track your progress and unlock badges"
    >
      <div className="w-full">
        {/* Progress Overview */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white">
              <TrophyIcon className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Achievement Progress</h2>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl font-bold text-brand-600">{unlockedCount}</span>
                <span className="text-gray-600">/ {achievements.length} unlocked</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filter === category
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-20 w-20 rounded-full mx-auto mb-4"></div>
                <div className="skeleton h-6 w-32 mx-auto mb-2"></div>
                <div className="skeleton h-4 w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`card p-6 transition-all hover:scale-105 ${
                  achievement.unlocked
                    ? getRarityColor(achievement.rarity)
                    : 'bg-gray-50 opacity-60'
                } border-2`}
              >
                {/* Icon */}
                <div className="relative mb-4">
                  <div className={`text-6xl mx-auto text-center ${!achievement.unlocked && 'grayscale'}`}>
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                  {achievement.unlocked && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                      ✓
                    </div>
                  )}
                </div>

                {/* Info */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                  {achievement.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  {achievement.description}
                </p>

                {/* Rewards */}
                <div className="flex items-center justify-center gap-4 mb-3 text-sm">
                  <span className="font-semibold">+{achievement.xp_reward} XP</span>
                  <span className="text-gray-400">•</span>
                  <span className="font-semibold">+{achievement.coin_reward} Coins</span>
                </div>

                {/* Rarity Badge */}
                <div className="text-center">
                  <span className="text-xs font-semibold">
                    {getRarityBadge(achievement.rarity)}
                  </span>
                </div>

                {/* Unlock Date */}
                {achievement.unlocked && achievement.unlocked_at && (
                  <div className="text-xs text-gray-500 text-center mt-3">
                    Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}