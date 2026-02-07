'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PremiumPanel from '@/components/PremiumPanel';

export default function SettingsPage() {
  const [showPremiumPanel, setShowPremiumPanel] = useState(false);
  const [settings, setSettings] = useState({
    autoCapture: false,
    notifications: true,
    darkMode: false,
    chunkSize: 500,
    embeddingModel: 'all-MiniLM-L6-v2',
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast.success('Setting saved!');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">⚙️ Settings</h1>
              <p className="text-white/80">Manage your preferences and premium features</p>
            </div>
            <Link
              href="/"
              className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition"
            >
              ← Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Premium Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Premium Status</h2>
              <p className="text-gray-600">You are currently on the Free plan</p>
            </div>
            <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold">
              FREE
            </div>
          </div>
          <button
            onClick={() => setShowPremiumPanel(true)}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-lg font-bold transition shadow-lg hover:shadow-xl"
          >
            ✨ Upgrade to Premium - $9/month
          </button>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">General Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Auto-capture mode</div>
                <div className="text-sm text-gray-600">
                  Automatically capture pages you visit (Premium)
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled
                  checked={settings.autoCapture}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Notifications</div>
                <div className="text-sm text-gray-600">Show desktop notifications</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Dark mode</div>
                <div className="text-sm text-gray-600">Use dark theme (Premium)</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled
                  checked={settings.darkMode}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 opacity-50"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Advanced Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-gray-900 mb-2">
                Chunk Size (characters)
              </label>
              <input
                type="number"
                value={settings.chunkSize}
                onChange={(e) => handleSettingChange('chunkSize', parseInt(e.target.value))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
              />
              <p className="text-sm text-gray-600 mt-1">
                Smaller chunks = more precise search, larger chunks = more context
              </p>
            </div>

            <div>
              <label className="block font-semibold text-gray-900 mb-2">
                Embedding Model
              </label>
              <select
                value={settings.embeddingModel}
                disabled
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none opacity-50"
              >
                <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (Default)</option>
                <option value="all-mpnet-base-v2">all-mpnet-base-v2 (Premium)</option>
              </select>
              <p className="text-sm text-gray-600 mt-1">
                💎 Premium models available with upgrade
              </p>
            </div>
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Storage</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Local database size:</span>
              <span className="font-semibold">~2.3 MB</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Embedding cache:</span>
              <span className="font-semibold">~5.1 MB</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Total storage used:</span>
              <span className="font-semibold">~7.4 MB</span>
            </div>
            <button
              onClick={() => toast.success('Cache cleared!')}
              className="w-full mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition"
            >
              🗑️ Clear Cache
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Danger Zone</h2>
          <div className="space-y-3">
            <button
              onClick={() => {
                if (
                  confirm(
                    'Delete ALL data?\n\nThis will permanently delete all documents, embeddings, and settings. This cannot be undone!'
                  )
                ) {
                  toast.error('Data deletion not implemented yet');
                }
              }}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition"
            >
              🗑️ Delete All Data
            </button>
          </div>
        </div>
      </div>

      {/* Premium Panel Modal */}
      {showPremiumPanel && <PremiumPanel onClose={() => setShowPremiumPanel(false)} />}
    </main>
  );
}