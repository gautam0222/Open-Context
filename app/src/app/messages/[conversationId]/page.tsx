'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: number;
  is_read: number;
}

interface OtherUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  level: number;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const currentUserId = 'user_default';

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
    loadConversationInfo();
  }, [conversationId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/messages/conversations/${conversationId}`);
      const data = await response.json();
      setMessages(data.messages || []);

      // Scroll to bottom
      setTimeout(() => {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadConversationInfo = async () => {
    try {
      // Get conversation details to find other user
      const response = await fetch('http://localhost:3001/api/messages/conversations');
      const data = await response.json();
      
      const conv = data.conversations?.find((c: any) => c.id === conversationId);
      if (conv?.otherUser) {
        setOtherUser(conv.otherUser);
      }
    } catch (error) {
      console.error('Failed to load conversation info:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      sender_id: currentUserId,
      content: newMessage.trim(),
      created_at: Date.now(),
      is_read: 0,
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    // Scroll to bottom
    setTimeout(() => {
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 0);

    try {
      const response = await fetch('http://localhost:3001/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: tempMessage.content,
        }),
      });

      if (!response.ok) throw new Error('Failed to send');

      const data = await response.json();

      // Replace temp message with real message
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id ? data.message : msg
      ));
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');

      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const handleDeleteConversation = async () => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/messages/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Conversation deleted');
      router.push('/messages');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  return (
    <MainLayout
      title="Messages"
      description={otherUser ? `Chat with ${otherUser.display_name}` : 'Loading...'}
      headerActions={
        <div className="flex gap-2">
          <Link href="/messages" className="btn-secondary">
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Link>
          <button onClick={handleDeleteConversation} className="btn-ghost text-red-600">
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      }
    >
      <div className="w-full max-w-4xl mx-auto h-[calc(100vh-250px)]">
        <div className="card h-full flex flex-col">
          {/* Chat Header */}
          {otherUser && (
            <div className="p-4 border-b border-gray-200">
              <Link
                href={`/profile/${otherUser.user_id}`}
                className="flex items-center gap-3 hover:opacity-80 transition"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {otherUser.avatar ? (
                    <img src={otherUser.avatar} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    otherUser.display_name?.charAt(0) || '?'
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{otherUser.display_name}</h3>
                  <p className="text-sm text-gray-600">@{otherUser.username} • Level {otherUser.level}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Messages */}
          <div
            id="messages-container"
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender_id === currentUserId;
                const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isOwn && (
                      <div className="w-8 h-8 flex-shrink-0">
                        {showAvatar && otherUser && (
                          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {otherUser.avatar ? (
                              <img src={otherUser.avatar} alt="" className="w-full h-full rounded-full" />
                            ) : (
                              otherUser.display_name?.charAt(0) || '?'
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`max-w-md ${!isOwn && !showAvatar ? 'ml-10' : ''}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-brand-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-right text-gray-500' : 'text-left text-gray-500'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="input flex-1"
                autoFocus
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="btn-primary px-6"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}