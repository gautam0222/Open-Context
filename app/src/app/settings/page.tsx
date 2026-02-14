'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  KeyIcon,
  Cog6ToothIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
  BellIcon,
  MoonIcon,
  DocumentDuplicateIcon,
  ServerIcon,
  CpuChipIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface StorageInfo {
  totalDocuments: number;
  totalWords: number;
  totalChunks: number;
  estimatedSize: string;
}

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [chunkSize, setChunkSize] = useState(500);
  const [embeddingModel, setEmbeddingModel] = useState('all-MiniLM-L6-v2');

  useEffect(() => {
    loadSettings();
    loadStorageInfo();
  }, []);

  const loadSettings = () => {
    // Load from localStorage
    const savedApiKey = localStorage.getItem('openrouter_api_key') || '';
    const savedAutoCapture = localStorage.getItem('auto_capture') !== 'false';
    const savedNotifications = localStorage.getItem('notifications') !== 'false';
    const savedDarkMode = localStorage.getItem('dark_mode') === 'true';
    const savedChunkSize = parseInt(localStorage.getItem('chunk_size') || '500');
    const savedEmbeddingModel = localStorage.getItem('embedding_model') || 'all-MiniLM-L6-v2';

    setApiKey(savedApiKey);
    setAutoCapture(savedAutoCapture);
    setNotifications(savedNotifications);
    setDarkMode(savedDarkMode);
    setChunkSize(savedChunkSize);
    setEmbeddingModel(savedEmbeddingModel);
  };

  const loadStorageInfo = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/stats');
      const data = await response.json();

      setStorageInfo({
        totalDocuments: data.totalDocuments || 0,
        totalWords: data.totalWords || 0,
        totalChunks: data.totalChunks || 0,
        estimatedSize: ((data.totalWords * 10) / 1024 / 1024).toFixed(2) + ' MB',
      });
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem('openrouter_api_key', apiKey);
    toast.success('API key saved locally!');
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/export/documents');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `open-context-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleClearCache = () => {
    if (!confirm('Clear all cached data? This will not delete your documents.')) return;

    localStorage.clear();
    toast.success('Cache cleared!');
    loadSettings();
  };

  const handleDeleteAllData = async () => {
    if (!confirm('⚠️ DELETE ALL DOCUMENTS?\n\nThis will permanently delete all your captured documents, chunks, and embeddings. This action CANNOT be undone!\n\nType "DELETE" to confirm.')) {
      return;
    }

    const confirmation = prompt('Type DELETE to confirm:');
    if (confirmation !== 'DELETE') {
      toast.error('Deletion cancelled');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/documents/all', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('All data deleted');
        loadStorageInfo();
      } else {
        toast.error('Failed to delete data');
      }
    } catch (error) {
      toast.error('Failed to delete data');
    }
  };

  const saveSetting = (key: string, value: any) => {
    localStorage.setItem(key, String(value));
    toast.success('Setting saved!');
  };

  return (
    <MainLayout
      title="Settings"
      description="Configure your Open Context experience"
    >
      <div className="w-full mx-auto space-y-6">
        {/* API Configuration */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
              <KeyIcon className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">API Configuration</h2>
              <p className="text-sm text-gray-600">Configure AI model access</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenRouter API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="input w-full pr-24"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button onClick={saveApiKey} className="btn-primary">
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Get your free API key from{' '} 
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:text-brand-700 underline"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Privacy:</strong> Your API key is stored locally in your browser and never sent to our servers. It's only used to make direct API calls to OpenRouter.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
              <p className="text-sm text-gray-600">Customize your experience</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <DocumentDuplicateIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Auto-capture</div>
                  <div className="text-sm text-gray-600">Automatically capture pages</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setAutoCapture(!autoCapture);
                  saveSetting('auto_capture', !autoCapture);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoCapture ? 'bg-brand-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoCapture ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <BellIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Notifications</div>
                  <div className="text-sm text-gray-600">Get notified about captures</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setNotifications(!notifications);
                  saveSetting('notifications', !notifications);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-brand-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <MoonIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Dark Mode</div>
                  <div className="text-sm text-gray-600">Use dark theme (coming soon)</div>
                </div>
              </div>
              <button
                onClick={() => {
                  toast('Dark mode coming soon!', { icon: '🌙' });
                }}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 opacity-50 cursor-not-allowed"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CpuChipIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Advanced Settings</h2>
              <p className="text-sm text-gray-600">Configure processing parameters</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chunk Size (characters)
              </label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => {
                  setChunkSize(Number(e.target.value));
                  saveSetting('chunk_size', e.target.value);
                }}
                min="100"
                max="2000"
                step="50"
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: 500. Smaller chunks = more precise search, larger chunks = more context
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Embedding Model
              </label>
              <select
                value={embeddingModel}
                onChange={(e) => {
                  setEmbeddingModel(e.target.value);
                  saveSetting('embedding_model', e.target.value);
                }}
                className="input w-full"
              >
                <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (Fast, 384D)</option>
                <option value="all-mpnet-base-v2">all-mpnet-base-v2 (Accurate, 768D)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Currently using: {embeddingModel}
              </p>
            </div>
          </div>
        </div>

        {/* Storage Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <ServerIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Storage Information</h2>
              <p className="text-sm text-gray-600">Database and cache usage</p>
            </div>
          </div>

          {storageInfo ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{storageInfo.totalDocuments}</div>
                <div className="text-sm text-gray-600">Documents</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {(storageInfo.totalWords / 1000).toFixed(1)}K
                </div>
                <div className="text-sm text-gray-600">Words</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{storageInfo.totalChunks}</div>
                <div className="text-sm text-gray-600">Chunks</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{storageInfo.estimatedSize}</div>
                <div className="text-sm text-gray-600">Est. Size</div>
              </div>
            </div>
          ) : (
            <div className="skeleton h-24 rounded-lg mb-6" />
          )}

          <div className="flex gap-3">
            <button onClick={handleExportData} className="btn-secondary flex-1">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export All Data
            </button>
            <button onClick={handleClearCache} className="btn-ghost flex-1">
              <TrashIcon className="w-4 h-4" />
              Clear Cache
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 border-2 border-error-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-error-50 rounded-lg flex items-center justify-center">
              <TrashIcon className="w-6 h-6 text-error-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-error-900">Danger Zone</h2>
              <p className="text-sm text-error-600">Irreversible actions</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDeleteAllData}
              className="w-full btn-ghost text-error-600 border-error-300 hover:bg-error-50"
            >
              <TrashIcon className="w-4 h-4" />
              Delete All Documents
            </button>

            <p className="text-xs text-gray-600">
              ⚠️ This will permanently delete all your captured documents, embeddings, and metadata. This action cannot be undone. Make sure to export your data first!
            </p>
          </div>
        </div>

        {/* About */}
<div className="card p-6">
  <div className="text-center">
    <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
      <SparklesIcon className="w-8 h-8 text-brand-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Context</h3>
    <p className="text-sm text-gray-600 mb-4">
      Your personal AI-powered knowledge base
    </p>
    
    {/* ADD THIS BUTTON */}
    <button
      onClick={() => {
        localStorage.removeItem('onboarding_completed');
        window.location.reload();
      }}
      className="btn-secondary mb-4"
    >
      🎓 Restart Onboarding Tutorial
    </button>

    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
      <span>Version 1.0.0</span>
      <span>•</span>
      <a href="https://github.com/yourusername/open-context" className="hover:text-brand-600">
        GitHub
      </a>
      <span>•</span>
      <a href="https://docs.opencontext.app" className="hover:text-brand-600">
        Documentation
      </a>
    </div>
  </div>
</div>
      </div>
    </MainLayout>
  );
}