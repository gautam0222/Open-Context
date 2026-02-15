'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import AvatarUpload from '@/components/Profile/AvatarUpload';
import CoverImageUpload from '@/components/Profile/CoverImageUpload';
import { useAuth } from '@clerk/nextjs';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ShareIcon,
  TrophyIcon,
  FireIcon,
  BookOpenIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface UserProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  cover_image: string | null;
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

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    avatar: '',
    cover_image: '',
  });

  useEffect(() => {
    if (clerkUser) {
      loadProfile();
      loadAchievements();
    }
  }, [clerkUser]);

  const loadProfile = async () => {
    try {
      const token = await getToken();
      const response = await fetch('http://localhost:3001/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`, // ADD THIS
        },
      });
      const data = await response.json();

      if (data.needsSetup) {
        router.push('/onboarding');
        return;
      }

      setProfile(data.profile);
      setEditForm({
        display_name: data.profile.display_name,
        username: data.profile.username,
        bio: data.profile.bio || '',
        avatar: data.profile.avatar || '',
        cover_image: data.profile.cover_image || '',
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

  const shareProfile = async () => {
    const url = `${window.location.origin}/profile/${profile?.user_id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.display_name}'s Profile`,
          text: `Check out my Open Context profile!`,
          url: url,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Profile link copied!');
    }
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
      <MainLayout title="Profile" description="Your learning profile">
        <div className="card p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600 mb-6">Let's create your profile!</p>
          <button onClick={() => router.push('/onboarding')} className="btn-primary">
            Create Profile
          </button>
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
          <div className="flex gap-2">
            <button onClick={shareProfile} className="btn-secondary text-sm">
              <ShareIcon className="w-4 h-4" />
              Share
            </button>
            <button onClick={() => setEditing(true)} className="btn-primary text-sm">
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-ghost text-sm">
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
            <button onClick={saveProfile} className="btn-primary text-sm">
              <CheckIcon className="w-4 h-4" />
              Save
            </button>
          </div>
        )
      }
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <div className="card overflow-hidden">
          {/* Cover Image */}
          {editing ? (
            <CoverImageUpload
              currentCover={editForm.cover_image}
              onUpload={(coverData) => setEditForm({ ...editForm, cover_image: coverData })}
              onRemove={() => setEditForm({ ...editForm, cover_image: '' })}
            />
          ) : (
            <div className="h-48 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500">
              {profile.cover_image && (
                <img src={profile.cover_image} alt="Cover" className="w-full h-full object-cover" />
              )}
            </div>
          )}

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row gap-6 -mt-16">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {editing ? (
                  <AvatarUpload
                    currentAvatar={editForm.avatar}
                    onUpload={(avatarData) => setEditForm({ ...editForm, avatar: avatarData })}
                    onRemove={() => setEditForm({ ...editForm, avatar: '' })}
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full border-4 border-white flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      profile.display_name?.charAt(0) || '?'
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pt-4">
                {editing ? (
                  <div className="space-y-4 max-w-2xl">
                    <div>
                      <label className="label text-sm">Display Name</label>
                      <input
                        type="text"
                        value={editForm.display_name}
                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="label text-sm">Username</label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="label text-sm">Bio</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        className="input w-full"
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                      {profile.display_name}
                    </h1>
                    <p className="text-gray-600 mb-3">@{profile.username}</p>
                    {profile.bio && (
                      <p className="text-gray-700 mb-4 max-w-2xl">{profile.bio}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold">
                        Level {profile.level}
                      </span>
                      <span className="text-sm text-gray-600">
                        {profile.xp} XP
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* XP Progress Bar */}
            {!editing && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {profile.xp} / {(profile.level + 1) * 400} XP
                  </span>
                  <span className="text-brand-600 font-medium">
                    Level {profile.level + 1} ({Math.round((profile.xp / ((profile.level + 1) * 400)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
                    style={{
                      width: `${Math.min((profile.xp / ((profile.level + 1) * 400)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{profile.total_documents}</div>
                <div className="text-sm text-gray-600">Documents</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {(profile.total_words_read / 1000).toFixed(1)}K
                </div>
                <div className="text-sm text-gray-600">Words Read</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <FireIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{profile.streak_days}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{achievements.length}</div>
                <div className="text-sm text-gray-600">Achievements</div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
            <button
              onClick={() => router.push('/achievements')}
              className="text-brand-600 hover:text-brand-700 font-medium text-sm"
            >
              View All →
            </button>
          </div>

          {achievements.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <TrophyIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No achievements unlocked yet
              </h3>
              <p className="text-gray-600">
                Start capturing content to unlock badges!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.slice(0, 8).map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-brand-500 hover:shadow-md transition text-center"
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <div className="font-semibold text-gray-900 text-sm mb-1">
                    {achievement.name}
                  </div>
                  <div className="text-xs text-gray-600">{achievement.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DocumentTextIcon className="w-5 h-5 text-brand-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Captured a document</p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrophyIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Unlocked achievement: Early Bird</p>
                <p className="text-xs text-gray-600">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}