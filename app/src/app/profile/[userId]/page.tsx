'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import {
  UserCircleIcon,
  TrophyIcon,
  FireIcon,
  BookOpenIcon,
  ShareIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface UserProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  bio: string | null;
  level: number;
  xp: number;
  coins: number;
  streak_days: number;
  total_documents: number;
  total_words_read: number;
  is_public: number;
  created_at: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  unlocked_at: number;
}

interface ActivityItem {
  id: string;
  action_type: string;
  entity_type: string;
  created_at: number;
  entity: any;
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    loadProfile();
    loadAchievements();
    loadActivity();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/profile`);
      const data = await response.json();
      setProfile(data.profile);
      setIsOwnProfile(data.isOwnProfile || false);
      setIsFollowing(data.isFollowing || false);
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/achievements`);
      const data = await response.json();
      setAchievements(data.achievements || []);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  const loadActivity = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/activity?limit=10`);
      const data = await response.json();
      setActivity(data.activity || []);
    } catch (error) {
      console.error('Failed to load activity:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const endpoint = isFollowing ? '/api/unfollow' : '/api/follow';
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) throw new Error('Failed');

      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? 'Unfollowed' : 'Following! 🎉');
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.display_name}'s Profile`,
          text: `Check out ${profile?.display_name} on Open Context!`,
          url: url,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        // User cancelled
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(url);
      toast.success('Profile link copied to clipboard!');
    }
  };

  const getXPForNextLevel = () => {
    if (!profile) return 0;
    return (profile.level + 1) ** 2 * 100;
  };

  const getXPProgress = () => {
    if (!profile) return 0;
    const currentLevelXP = profile.level ** 2 * 100;
    const nextLevelXP = getXPForNextLevel();
    const progressXP = profile.xp - currentLevelXP;
    const requiredXP = nextLevelXP - currentLevelXP;
    return (progressXP / requiredXP) * 100;
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-gray-100 text-gray-700 border-gray-300',
      rare: 'bg-blue-100 text-blue-700 border-blue-300',
      epic: 'bg-purple-100 text-purple-700 border-purple-300',
      legendary: 'bg-amber-100 text-amber-700 border-amber-300',
    };
    return colors[rarity] || colors.common;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <MainLayout title="Profile" description="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout title="Profile" description="User not found">
        <div className="card p-12 text-center">
          <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User not found</h3>
          <p className="text-gray-600">This profile doesn't exist or is private.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={profile.display_name}
      description={`@${profile.username}`}
      headerActions={
        <div className="flex gap-2">
          <button onClick={handleShare} className="btn-secondary">
            <ShareIcon className="w-4 h-4" />
            Share Profile
          </button>
          {!isOwnProfile && (
            <>
              <button
                onClick={handleFollow}
                className={`${
                  isFollowing
                    ? 'btn-secondary'
                    : 'btn-primary'
                }`}
              >
                {isFollowing ? (
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
              <Link href={`/messages/${userId}`} className="btn-secondary">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                Message
              </Link>
            </>
          )}
          {isOwnProfile && (
            <Link href="/profile" className="btn-primary">
              Edit Profile
            </Link>
          )}
        </div>
      }
    >
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="card overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-6 -mt-16">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full border-4 border-white flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    profile.display_name?.charAt(0) || '?'
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 pt-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{profile.display_name}</h1>
                  <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold">
                    Level {profile.level}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">@{profile.username}</p>
                {profile.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}

                {/* Stats Row */}
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="font-bold text-gray-900">{profile.total_documents}</span>
                    <span className="text-gray-600 ml-1">Documents</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">{achievements.length}</span>
                    <span className="text-gray-600 ml-1">Achievements</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">{profile.streak_days}</span>
                    <span className="text-gray-600 ml-1">Day Streak 🔥</span>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">
                  {profile.xp.toLocaleString()} / {getXPForNextLevel().toLocaleString()} XP
                </span>
                <span className="font-semibold text-brand-600">
                  Level {profile.level + 1} ({Math.round(getXPProgress())}%)
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${getXPProgress()}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpenIcon className="w-6 h-6 text-brand-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {profile.total_documents}
            </div>
            <div className="text-sm text-gray-600">Documents</div>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(profile.total_words_read / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-gray-600">Words Read</div>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FireIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {profile.streak_days}
            </div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrophyIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {achievements.length}
            </div>
            <div className="text-sm text-gray-600">Achievements</div>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.slice(0, 8).map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border-2 text-center transition hover:scale-105 ${getRarityColor(achievement.rarity)}`}
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <div className="font-semibold text-sm mb-1">{achievement.name}</div>
                  <div className="text-xs opacity-75">{achievement.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {activity.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                    <BookOpenIcon className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {item.action_type === 'captured' && 'Captured a document'}
                      {item.action_type === 'completed_goal' && 'Completed a goal'}
                      {item.action_type === 'shared' && 'Shared a collection'}
                    </div>
                    <div className="text-xs text-gray-500">{formatTimeAgo(item.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}