'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  PlusIcon,
  UsersIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UserGroupIcon,
  ShareIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  type: string;
  owner_id: string;
  avatar: string | null;
  is_public: number;
  member_limit: number;
  created_at: number;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
    type: 'personal',
    is_public: false,
  });

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/workspaces');
      const data = await response.json();
      setWorkspaces(data.workspaces || []);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspace.name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkspace),
      });

      if (!response.ok) throw new Error('Failed to create workspace');

      toast.success('Workspace created! 🎉');
      setShowModal(false);
      setNewWorkspace({
        name: '',
        description: '',
        type: 'personal',
        is_public: false,
      });
      loadWorkspaces();
    } catch (error) {
      console.error('Create workspace error:', error);
      toast.error('Failed to create workspace');
    }
  };

  const getWorkspaceIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      personal: <UsersIcon className="w-8 h-8" />,
      family: <UserGroupIcon className="w-8 h-8" />,
      team: <UsersIcon className="w-8 h-8" />,
      public: <GlobeAltIcon className="w-8 h-8" />,
    };
    return icons[type] || icons.personal;
  };

  const getWorkspaceColor = (type: string) => {
    const colors: Record<string, string> = {
      personal: 'from-brand-500 to-brand-600',
      family: 'from-green-500 to-green-600',
      team: 'from-purple-500 to-purple-600',
      public: 'from-blue-500 to-blue-600',
    };
    return colors[type] || colors.personal;
  };

  return (
    <MainLayout
      title="Workspaces"
      description="Collaborate and share knowledge with others"
      headerActions={
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          New Workspace
        </button>
      }
    >
      <div className="w-full mx-auto">
        {/* Info Banner */}
        <div className="card p-6 mb-6 bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <UsersIcon className="w-6 h-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">What are Workspaces?</h3>
              <p className="text-sm text-gray-700">
                Workspaces let you organize and share collections with family, teams, or the public. 
                Create separate spaces for different aspects of your learning journey!
              </p>
            </div>
          </div>
        </div>

        {/* Workspaces Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-16 w-16 rounded-xl mb-4"></div>
                <div className="skeleton h-6 w-32 mb-2"></div>
                <div className="skeleton h-4 w-full"></div>
              </div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UsersIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workspaces yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first workspace to start collaborating!
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <PlusIcon className="w-4 h-4" />
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="card p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              >
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${getWorkspaceColor(workspace.type)} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {getWorkspaceIcon(workspace.type)}
                </div>

                {/* Info */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{workspace.name}</h3>
                    {workspace.is_public ? (
                      <GlobeAltIcon className="w-4 h-4 text-blue-500" title="Public" />
                    ) : (
                      <LockClosedIcon className="w-4 h-4 text-gray-400" title="Private" />
                    )}
                  </div>
                  {workspace.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{workspace.description}</p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UsersIcon className="w-4 h-4" />
                    <span>1 member</span>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold capitalize">
                    {workspace.type}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/workspaces/${workspace.id}`}
                    className="btn-secondary flex-1 justify-center text-sm"
                  >
                    Open
                  </Link>
                  <button className="btn-ghost p-2">
                    <Cog6ToothIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Create New Card */}
            <button
              onClick={() => setShowModal(true)}
              className="card p-6 border-2 border-dashed border-gray-300 hover:border-brand-500 hover:bg-brand-50 transition-all duration-300 flex flex-col items-center justify-center min-h-[240px] group"
            >
              <div className="w-16 h-16 bg-gray-100 group-hover:bg-brand-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <PlusIcon className="w-8 h-8 text-gray-400 group-hover:text-brand-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Create Workspace</h3>
              <p className="text-sm text-gray-600 text-center">
                Start a new collaborative space
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Workspace</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                  placeholder="e.g., Family Learning, Work Team, Study Group"
                  className="input w-full"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newWorkspace.description}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                  placeholder="What is this workspace for?"
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'personal', label: 'Personal', icon: '👤' },
                    { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
                    { value: 'team', label: 'Team', icon: '👥' },
                    { value: 'public', label: 'Public', icon: '🌍' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewWorkspace({ ...newWorkspace, type: type.value })}
                      className={`p-4 rounded-lg border-2 transition ${
                        newWorkspace.type === type.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-semibold text-sm">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Public Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Public Workspace</div>
                  <div className="text-sm text-gray-600">Anyone can discover and join</div>
                </div>
                <button
                  onClick={() => setNewWorkspace({ ...newWorkspace, is_public: !newWorkspace.is_public })}
                  className={`w-12 h-6 rounded-full transition ${
                    newWorkspace.is_public ? 'bg-brand-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      newWorkspace.is_public ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button onClick={createWorkspace} className="btn-primary flex-1">
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}