'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  UserCircleIcon,
  TrophyIcon,
  FireIcon,
  BookOpenIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ShareIcon,
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
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  unlocked_at: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    bio: '',
  });

  useEffect(() => {
    loadProfile();
    loadAchievements();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/profile');
      const data = await response.json();
      setProfile(data.profile);
      setEditForm({
        display_name: data.profile.display_name,
        username: data.profile.username,
        bio: data.profile.bio || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/achievements/unlocked');
      const data = await response.json();
      setAchievements(data.achievements || []);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  const saveProfile = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Profile updated! ✅');
      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save profile');
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

  if (loading) {
    return (
      <MainLayout title="Profile" description="Your learning profile">
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout title="Profile" description="Your learning profile">
        <div className="card p-12 text-center">
          <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile not found</h3>
        </div>
      </MainLayout>
    );
  }

return (
  <MainLayout
    title="Profile"
    description="Your learning journey"
    headerActions={
      !editing ? (
        <button onClick={() => setEditing(true)} className="btn-secondary">
          <PencilIcon className="w-4 h-4" />
          Edit Profile
        </button>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="btn-ghost">
            <XMarkIcon className="w-4 h-4" />
            Cancel
          </button>
          <button onClick={saveProfile} className="btn-primary">
            <CheckIcon className="w-4 h-4" />
            Save
          </button>
        </div>
      )
    }
  >
    {/* REMOVE max-w-4xl mx-auto */}
    <div className="space-y-6 w-full">
      {/* Profile Header */}
      <div className="card overflow-hidden">
        {/* Cover Image - REDUCED HEIGHT */}
        <div className="h-24 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-6 -mt-12">
            {/* Avatar - SMALLER */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full border-4 border-white flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full rounded-full" />
                ) : (
                  profile.display_name?.charAt(0) || '?'
                )}
              </div>
            </div>

            {/* Rest of profile content... */}

              {/* User Info */}
              <div className="flex-1 pt-4">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      placeholder="Display Name"
                      className="input w-full"
                    />
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      placeholder="Username"
                      className="input w-full"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Bio (optional)"
                      rows={3}
                      className="input w-full resize-none"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{profile.display_name}</h1>
                      <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold">
                        Level {profile.level}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">@{profile.username}</p>
                    {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
                  </>
                )}
              </div>

              {/* Share Button */}
              {!editing && (
                <button className="btn-secondary self-start mt-4">
                  <ShareIcon className="w-4 h-4" />
                  Share Profile
                </button>
              )}
            </div>

            {/* XP Progress */}
            {!editing && (
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
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
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
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
            <Link href="/achievements" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
              View All →
            </Link>
          </div>

          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No achievements unlocked yet</p>
              <p className="text-sm text-gray-500 mt-2">Start capturing content to unlock badges!</p>
            </div>
          ) : (
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
          )}
        </div>

        {/* Activity Feed */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <BookOpenIcon className="w-5 h-5 text-brand-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Captured a document</div>
                <div className="text-xs text-gray-500">2 hours ago</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Unlocked achievement: Early Bird</div>
                <div className="text-xs text-gray-500">1 day ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}