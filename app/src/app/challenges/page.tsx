'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  coin_reward: number;
  difficulty: string;
  icon: string;
  progress: number;
  completed: boolean;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/challenges/daily');
      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-amber-100 text-amber-700',
      hard: 'bg-red-100 text-red-700',
    };
    return colors[difficulty] || colors.easy;
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const totalXP = challenges.reduce((sum, c) => sum + (c.completed ? c.xp_reward : 0), 0);

  return (
    <MainLayout
      title="Daily Challenges"
      description="Complete challenges to earn XP and coins"
    >
      <div className="w-full">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card p-6 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">{completedCount}/{challenges.length}</div>
                <div className="text-sm opacity-90">Challenges Completed</div>
              </div>
              <TrophyIcon className="w-12 h-12 opacity-50" />
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">{totalXP}</div>
                <div className="text-sm opacity-90">XP Earned Today</div>
              </div>
              <SparklesIcon className="w-12 h-12 opacity-50" />
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">
                  {24 - new Date().getHours()}h
                </div>
                <div className="text-sm opacity-90">Time Remaining</div>
              </div>
              <ClockIcon className="w-12 h-12 opacity-50" />
            </div>
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`card p-6 transition-all ${
                challenge.completed
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
                  : 'hover:shadow-lg'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-4xl ${challenge.completed && 'grayscale'}`}>
                    {challenge.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                  </div>
                </div>
                {challenge.completed && (
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {challenge.progress} / {challenge.target_value}
                  </span>
                  <span className="font-semibold text-brand-600">
                    {Math.round((challenge.progress / challenge.target_value) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      challenge.completed
                        ? 'bg-green-500'
                        : 'bg-gradient-to-r from-brand-500 to-purple-500'
                    }`}
                    style={{
                      width: `${Math.min((challenge.progress / challenge.target_value) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <TrophyIcon className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold">+{challenge.xp_reward} XP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <SparklesIcon className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold">+{challenge.coin_reward} Coins</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}