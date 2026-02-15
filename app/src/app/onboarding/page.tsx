'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    display_name: user?.fullName || '',
    bio: '',
    interests: [] as string[],
  });

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Get Clerk session token
      const token = await getToken();
      
      // Create user profile
      const response = await fetch('http://localhost:3001/api/profile/setup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          email: user?.primaryEmailAddress?.emailAddress,
          avatar: user?.imageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to setup profile');
      }

      toast.success('Welcome to Open Context! 🎉');
      router.push('/');
    } catch (error) {
      console.error('Setup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to setup profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">
              👋
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Open Context!
            </h1>
            <p className="text-gray-600 mb-2">
              Hi {user.firstName || 'there'}! Let's set up your profile
            </p>
            <p className="text-sm text-gray-500 mb-8">
              This will only take a minute
            </p>
            <button onClick={() => setStep(2)} className="btn-primary">
              Get Started →
            </button>
          </div>
        )}

        {/* Step 2: Profile Setup */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Create Your Profile
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Username *</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="johndoe"
                  className="input w-full"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Letters, numbers, and underscores only
                </p>
              </div>

              <div>
                <label className="label">Display Name *</label>
                <input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  placeholder="John Doe"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Bio (optional)</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="input w-full"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profile.bio.length}/500 characters
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1">
                ← Back
              </button>
              <button 
                onClick={() => setStep(3)} 
                className="btn-primary flex-1"
                disabled={!profile.username || !profile.display_name || profile.username.length < 3}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Import Options */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Import Your Knowledge (Optional)
            </h2>
            
            <p className="text-gray-600 mb-6">
              You can skip this step and add content later
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => router.push('/upload')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition text-left"
              >
                <div className="text-4xl mb-3">📁</div>
                <div className="font-semibold mb-1">Upload Files</div>
                <div className="text-sm text-gray-600">Import PDFs, DOCX, TXT</div>
              </button>

              <button 
                onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-left"
              >
                <div className="text-4xl mb-3">🔗</div>
                <div className="font-semibold mb-1">Browser Extension</div>
                <div className="text-sm text-gray-600">Capture web content</div>
              </button>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(2)} 
                className="btn-ghost flex-1"
                disabled={loading}
              >
                ← Back
              </button>
              <button 
                onClick={handleComplete} 
                className="btn-primary flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  'Complete Setup ✨'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}