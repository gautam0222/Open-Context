'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  SparklesIcon,
  FireIcon,
  BookOpenIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ActivityItem {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  created_at: number;
  user: {
    username: string;
    display_name: string;
    avatar: string | null;
    level: number;
  } | null;
  entity: any;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  content: string;
  created_at: number;
  likes: number;
}

export default function FeedPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'following' | 'trending'>('all');
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    loadFeed();
  }, [filter]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/feed?filter=${filter}`);
      const data = await response.json();
      setActivity(data.activity || []);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (activityId: string) => {
    try {
      const item = activity.find(a => a.id === activityId);
      const isLiked = item?.is_liked;

      const response = await fetch('http://localhost:3001/api/activity/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activityId,
          action: isLiked ? 'unlike' : 'like',
        }),
      });

      if (!response.ok) throw new Error('Failed to like');

      // Update local state
      setActivity(prev => prev.map(item => {
        if (item.id === activityId) {
          return {
            ...item,
            is_liked: !isLiked,
            likes_count: (item.likes_count || 0) + (isLiked ? -1 : 1),
          };
        }
        return item;
      }));

      if (!isLiked) {
        toast.success('❤️ Liked!');
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to like');
    }
  };

  const openComments = async (item: ActivityItem) => {
    setSelectedActivity(item);
    setCommentModalOpen(true);
    loadComments(item.id);
  };

  const loadComments = async (activityId: string) => {
    setLoadingComments(true);
    try {
      const response = await fetch(`http://localhost:3001/api/activity/${activityId}/comments`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedActivity) return;

    try {
      const response = await fetch('http://localhost:3001/api/activity/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: selectedActivity.id,
          content: newComment,
        }),
      });

      if (!response.ok) throw new Error('Failed to comment');

      const data = await response.json();
      setComments(prev => [data.comment, ...prev]);
      setNewComment('');

      // Update comment count
      setActivity(prev => prev.map(item => {
        if (item.id === selectedActivity.id) {
          return {
            ...item,
            comments_count: (item.comments_count || 0) + 1,
          };
        }
        return item;
      }));

      toast.success('Comment added! 💬');
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleShare = async (item: ActivityItem) => {
    const url = `${window.location.origin}/feed/${item.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.user?.display_name}'s activity`,
          text: 'Check this out on Open Context!',
          url: url,
        });
        
        // Track share
        await fetch('http://localhost:3001/api/activity/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activity_id: item.id }),
        });

        toast.success('Shared! 🎉');
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getActionText = (action: string) => {
    const actions: Record<string, string> = {
      captured: 'saved',
      shared: 'shared',
      commented: 'commented on',
      liked: 'liked',
      completed_goal: 'completed a goal',
    };
    return actions[action] || action;
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, JSX.Element> = {
      captured: <SparklesIcon className="w-5 h-5 text-brand-600" />,
      shared: <ShareIcon className="w-5 h-5 text-purple-600" />,
      completed_goal: <FireIcon className="w-5 h-5 text-amber-600" />,
    };
    return icons[action] || <SparklesIcon className="w-5 h-5 text-gray-600" />;
  };

  return (
    <MainLayout
      title="Discover"
      description="See what others are learning"
    >
      <div className="w-full max-w-4xl mx-auto">
        {/* Filter Tabs */}
        <div className="card p-2 mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              filter === 'following'
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setFilter('trending')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              filter === 'trending'
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FireIcon className="w-5 h-5" />
            Trending
          </button>
        </div>

        {/* Activity Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="skeleton w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-48" />
                    <div className="skeleton h-20 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="card p-12 text-center">
            <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity yet</h3>
            <p className="text-gray-600 mb-6">
              Start capturing content or follow others to see activity here!
            </p>
            <Link href="/upload" className="btn-primary">
              Upload Your First Document
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activity.map((item) => (
              <div key={item.id} className="card p-6 hover:shadow-lg transition">
                {/* User Header */}
                <div className="flex items-start gap-4 mb-4">
                  <Link href={`/profile/${item.user_id}`} className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold hover:scale-110 transition">
                      {item.user?.avatar ? (
                        <img src={item.user.avatar} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        item.user?.display_name?.charAt(0) || '?'
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/profile/${item.user_id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition">
                        {item.user?.display_name || 'Anonymous'}
                      </Link>
                      <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs font-semibold">
                        Lv. {item.user?.level || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {getActionIcon(item.action_type)}
                      <span>{getActionText(item.action_type)} a {item.entity_type}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(item.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Entity Content */}
                {item.entity && (
                  <div className="ml-16 mb-4">
                    {item.entity_type === 'document' && (
                      <Link
                        href={`/library/${item.entity.id}`}
                        className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                      >
                        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                          {item.entity.title}
                        </h4>
                        {item.entity.excerpt && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {item.entity.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          <span><BookOpenIcon className="w-4 h-4 inline mr-1" />{item.entity.word_count?.toLocaleString()} words</span>
                        </div>
                      </Link>
                    )}

                    {item.entity_type === 'collection' && (
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {item.entity.name}
                        </h4>
                        {item.entity.description && (
                          <p className="text-sm text-gray-600">
                            {item.entity.description}
                          </p>
                        )}
                      </div>
                    )}

                    {item.entity_type === 'goal' && (
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-gray-900 mb-1">
                          🎯 {item.entity.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          +{item.entity.xp_reward} XP earned
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="ml-16 flex items-center gap-6 text-gray-500">
                  <button
                    onClick={() => handleLike(item.id)}
                    className={`flex items-center gap-2 transition ${
                      item.is_liked ? 'text-red-500' : 'hover:text-red-500'
                    }`}
                  >
                    {item.is_liked ? (
                      <HeartIconSolid className="w-5 h-5" />
                    ) : (
                      <HeartIcon className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium">
                      {item.likes_count || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => openComments(item)}
                    className="flex items-center gap-2 hover:text-brand-600 transition"
                  >
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {item.comments_count || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => handleShare(item)}
                    className="flex items-center gap-2 hover:text-green-600 transition"
                  >
                    <ShareIcon className="w-5 h-5" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {commentModalOpen && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Comments</h2>
                <button
                  onClick={() => setCommentModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {comment.avatar ? (
                        <img src={comment.avatar} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        comment.display_name?.charAt(0) || '?'
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-semibold text-gray-900 mb-1">
                          {comment.display_name}
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{formatTimeAgo(comment.created_at)}</span>
                        <button className="hover:text-brand-600">Like</button>
                        <button className="hover:text-brand-600">Reply</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Write a comment..."
                  className="input flex-1"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="btn-primary"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}