'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import {
  UsersIcon,
  FolderIcon,
  PlusIcon,
  Cog6ToothIcon,
  ShareIcon,
  UserPlusIcon,
  XMarkIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  type: string;
  owner_id: string;
  is_public: number;
  created_at: number;
}

interface Member {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: number;
}

interface SharedCollection {
  id: string;
  collection_id: string;
  collection_name: string;
  shared_by: string;
  permissions: string;
  shared_at: number;
  document_count: number;
}

interface ActivityItem {
  id: string;
  user_id: string;
  username: string;
  action_type: string;
  entity_type: string;
  created_at: number;
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [collections, setCollections] = useState<SharedCollection[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  useEffect(() => {
    loadWorkspace();
    loadMembers();
    loadCollections();
    loadActivity();
  }, [workspaceId]);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}`);
      const data = await response.json();
      setWorkspace(data.workspace);
    } catch (error) {
      console.error('Failed to load workspace:', error);
      toast.error('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/members`);
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadCollections = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/collections`);
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const loadActivity = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/activity?limit=20`);
      const data = await response.json();
      setActivity(data.activity || []);
    } catch (error) {
      console.error('Failed to load activity:', error);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (!response.ok) throw new Error('Failed to invite');

      toast.success('Invitation sent! 📧');
      setShowInviteModal(false);
      setInviteEmail('');
      loadMembers();
    } catch (error) {
      console.error('Invite error:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId: string, displayName: string) => {
    if (!confirm(`Remove ${displayName} from this workspace?`)) return;

    try {
      const response = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove');

      toast.success('Member removed');
      loadMembers();
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Role updated');
      loadMembers();
    } catch (error) {
      console.error('Update role error:', error);
      toast.error('Failed to update role');
    }
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, JSX.Element> = {
      owner: <ShieldCheckIcon className="w-4 h-4 text-purple-600" />,
      admin: <ShieldCheckIcon className="w-4 h-4 text-blue-600" />,
      member: <UserIcon className="w-4 h-4 text-green-600" />,
      viewer: <EyeIcon className="w-4 h-4 text-gray-600" />,
    };
    return icons[role] || icons.member;
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-700',
      admin: 'bg-blue-100 text-blue-700',
      member: 'bg-green-100 text-green-700',
      viewer: 'bg-gray-100 text-gray-700',
    };
    return badges[role] || badges.member;
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
      <MainLayout title="Workspace" description="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  if (!workspace) {
    return (
      <MainLayout title="Workspace" description="Not found">
        <div className="card p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Workspace not found</h3>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={workspace.name}
      description={workspace.description || undefined}
      headerActions={
        <div className="flex gap-2">
          <button onClick={() => setShowInviteModal(true)} className="btn-secondary">
            <UserPlusIcon className="w-4 h-4" />
            Invite
          </button>
          <button className="btn-secondary">
            <ShareIcon className="w-4 h-4" />
            Share
          </button>
          <button onClick={() => setShowSettingsModal(true)} className="btn-secondary">
            <Cog6ToothIcon className="w-4 h-4" />
            Settings
          </button>
        </div>
      }
    >
      <div className="w-full space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{members.length}</div>
                <div className="text-sm text-gray-600">Members</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FolderIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{collections.length}</div>
                <div className="text-sm text-gray-600">Collections</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShareIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {collections.reduce((sum, c) => sum + c.document_count, 0)}
                </div>
                <div className="text-sm text-gray-600">Shared Documents</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members List */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Members ({members.length})</h2>
                <button onClick={() => setShowInviteModal(true)} className="btn-primary">
                  <UserPlusIcon className="w-4 h-4" />
                  Add Member
                </button>
              </div>

              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {member.avatar ? (
                        <img src={member.avatar} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        member.display_name?.charAt(0) || '?'
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${member.user_id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition">
                        {member.display_name}
                      </Link>
                      <div className="text-sm text-gray-600">@{member.username}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Joined {formatTimeAgo(member.joined_at)}
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        disabled={member.role === 'owner'}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 ${getRoleBadge(member.role)} ${
                          member.role === 'owner' ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        {member.role === 'owner' && <option value="owner">Owner</option>}
                      </select>

                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.display_name)}
                          className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activity.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No activity yet</p>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShareIcon className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900">
                        <span className="font-semibold">{item.username}</span>{' '}
                        {item.action_type === 'shared' && 'shared a collection'}
                        {item.action_type === 'joined' && 'joined the workspace'}
                        {item.action_type === 'commented' && 'added a comment'}
                      </p>
                      <p className="text-gray-500 text-xs">{formatTimeAgo(item.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Shared Collections */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Shared Collections ({collections.length})</h2>
            <Link href="/collections" className="btn-secondary">
              <PlusIcon className="w-4 h-4" />
              Share Collection
            </Link>
          </div>

          {collections.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No collections shared yet</p>
              <Link href="/collections" className="btn-primary">
                Share Your First Collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <div key={collection.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-start gap-3">
                    <FolderIcon className="w-8 h-8 text-brand-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{collection.collection_name}</h3>
                      <div className="text-sm text-gray-600 mb-2">
                        {collection.document_count} documents
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full ${
                          collection.permissions === 'edit' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {collection.permissions === 'edit' ? '✏️ Can edit' : '👁️ View only'}
                        </span>
                        <span>{formatTimeAgo(collection.shared_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Invite Member</h2>
                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="input w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="input w-full"
                >
                  <option value="viewer">Viewer - Can view shared collections</option>
                  <option value="member">Member - Can add content</option>
                  <option value="admin">Admin - Can manage workspace</option>
                </select>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  An invitation email will be sent to this address. They can join by clicking the link in the email.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowInviteModal(false)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button onClick={handleInviteMember} className="btn-primary flex-1">
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}