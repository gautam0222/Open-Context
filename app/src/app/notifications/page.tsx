'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  BellIcon,
  CheckCircleIcon,
  TrophyIcon,
  FireIcon,
  UserPlusIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  icon: string | null;
  is_read: number;
  priority: string;
  created_at: number;
  read_at: number | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/notifications');
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1, read_at: Date.now() } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

      await Promise.all(
        unreadIds.map(id =>
          fetch(`http://localhost:3001/api/notifications/${id}/read`, {
            method: 'PUT',
          })
        )
      );

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: 1, read_at: Date.now() }))
      );

      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}`, {
        method: 'DELETE',
      });

      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string, icon: string | null) => {
    if (icon) return icon;

    const icons: Record<string, JSX.Element> = {
      level_up: <TrophyIcon className="w-6 h-6 text-amber-600" />,
      achievement: <TrophyIcon className="w-6 h-6 text-purple-600" />,
      goal_completed: <CheckCircleIcon className="w-6 h-6 text-green-600" />,
      streak: <FireIcon className="w-6 h-6 text-orange-600" />,
      follow: <UserPlusIcon className="w-6 h-6 text-blue-600" />,
      like: <HeartIcon className="w-6 h-6 text-red-600" />,
      comment: <ChatBubbleLeftIcon className="w-6 h-6 text-brand-600" />,
      default: <BellIcon className="w-6 h-6 text-gray-600" />,
    };

    return icons[type] || icons.default;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter(n => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <MainLayout
      title="Notifications"
      description="Stay updated with your learning activity"
      headerActions={
        unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary">
            <CheckCircleIcon className="w-4 h-4" />
            Mark All Read
          </button>
        )
      }
    >
      <div className="w-full mx-auto">
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
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              filter === 'unread'
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-4">
                <div className="flex gap-4">
                  <div className="skeleton w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-48" />
                    <div className="skeleton h-3 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="card p-12 text-center">
            <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unread'
                ? "You've read all your notifications"
                : "You'll see notifications here when you have activity"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`card p-4 transition-all hover:shadow-md cursor-pointer group ${
                  !notification.is_read
                    ? 'bg-brand-50 border-l-4 border-brand-600'
                    : 'bg-white'
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                  if (notification.action_url) {
                    window.location.href = notification.action_url;
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.priority === 'high'
                        ? 'bg-red-100'
                        : notification.is_read
                        ? 'bg-gray-100'
                        : 'bg-brand-100'
                    }`}
                  >
                    {notification.icon ? (
                      <span className="text-2xl">{notification.icon}</span>
                    ) : (
                      getNotificationIcon(notification.type, notification.icon)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatTimeAgo(notification.created_at)}</span>
                      {!notification.is_read && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-brand-600">New</span>
                        </>
                      )}
                      {notification.priority === 'high' && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-red-600">Important</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    {!notification.is_read && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Mark as read"
                      >
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <XMarkIcon className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}