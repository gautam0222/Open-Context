'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { 
  TrophyIcon, 
  FireIcon, 
  BookOpenIcon, 
  ClockIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  level: number;
  xp: number;
  total_documents: number;
  total_words_read: number;
  streak_days: number;
  is_following?: boolean;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'xp' | 'documents' | 'words' | 'streak'>('xp');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all_time'>('all_time');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadLeaderboard();
  }, [filter, period]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/leaderboard?type=${filter}&period=${period}`);
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    try {
      const endpoint = currentlyFollowing ? '/api/unfollow' : '/api/follow';
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) throw new Error('Failed to follow/unfollow');

      setFollowingMap(prev => ({
        ...prev,
        [userId]: !currentlyFollowing,
      }));

      toast.success(currentlyFollowing ? 'Unfollowed' : 'Following!');
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow user');
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-600';
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getStatValue = (entry: LeaderboardEntry) => {
    switch (filter) {
      case 'xp':
        return `${entry.xp.toLocaleString()} XP`;
      case 'documents':
        return `${entry.total_documents} docs`;
      case 'words':
        return `${(entry.total_words_read / 1000).toFixed(1)}K words`;
      case 'streak':
        return `${entry.streak_days} days`;
      default:
        return '';
    }
  };

  return (
    <MainLayout title="Leaderboard" description="Compete with learners worldwide">
      <div className="w-full max-w-5xl mx-auto">
        {/* Filter Tabs */}
        <div className="card p-2 mb-6 grid grid-cols-4 gap-2">
          <button
            onClick={() => setFilter('xp')}
            className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              filter === 'xp' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrophyIcon className="w-5 h-5" />
            XP
          </button>
          <button
            onClick={() => setFilter('documents')}
            className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              filter === 'documents' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpenIcon className="w-5 h-5" />
            Docs
          </button>
          <button
            onClick={() => setFilter('words')}
            className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              filter === 'words' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ClockIcon className="w-5 h-5" />
            Words
          </button>
          <button
            onClick={() => setFilter('streak')}
            className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              filter === 'streak' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FireIcon className="w-5 h-5" />
            Streak
          </button>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'all_time', label: 'All Time' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as any)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                period === p.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No leaderboard data yet</h3>
              <p className="text-gray-600">Start capturing content to appear on the leaderboard!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`p-6 hover:bg-gray-50 transition ${
                    entry.rank <= 3 ? 'bg-gradient-to-r from-amber-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`text-3xl font-bold ${getRankColor(entry.rank)} w-16 text-center flex-shrink-0`}>
                      {getRankMedal(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <Link href={`/profile/${entry.user_id}`} className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:scale-110 transition">
                        {entry.avatar ? (
                          <img src={entry.avatar} alt="" className="w-full h-full rounded-full" />
                        ) : (
                          entry.display_name?.charAt(0) || '?'
                        )}
                      </div>
                    </Link>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${entry.user_id}`} className="flex items-center gap-2 mb-1 group">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-brand-600 transition">
                          {entry.display_name}
                        </h3>
                        <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs font-semibold">
                          Lv. {entry.level}
                        </span>
                      </Link>
                      <p className="text-sm text-gray-600">@{entry.username}</p>
                    </div>

                    {/* Stat */}
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold text-brand-600">
                        {getStatValue(entry)}
                      </div>
                    </div>

                    {/* Follow/Message Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFollow(entry.user_id, followingMap[entry.user_id])}
                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                          followingMap[entry.user_id]
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-brand-600 text-white hover:bg-brand-700'
                        }`}
                      >
                        {followingMap[entry.user_id] ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="w-4 h-4" />
                            Follow
                          </>
                        )}
                      </button>
                      <Link
                        href={`/messages/${entry.user_id}`}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}