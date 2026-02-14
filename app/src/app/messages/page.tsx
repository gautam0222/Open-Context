'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Conversation {
  id: string;
  otherUser: {
    user_id: string;
    username: string;
    display_name: string;
    avatar: string | null;
    level: number;
  } | null;
  lastMessage: {
    content: string;
    created_at: number;
    sender_id: string;
  } | null;
  unreadCount: number;
  last_message_at: number | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: number;
  is_read: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUserId = 'user_default';

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/messages/conversations');
      const data = await response.json();
      setConversations(data.conversations || []);

      // Auto-select first conversation
      if (data.conversations && data.conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(data.conversations[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
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
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

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
          conversation_id: selectedConversation.id,
          content: tempMessage.content,
        }),
      });

      if (!response.ok) throw new Error('Failed to send');

      const data = await response.json();

      // Replace temp message with real message
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id ? data.message : msg
      ));

      // Update conversation list
      loadConversations();
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');

      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/messages/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Conversation deleted');
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser?.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout
      title="Messages"
      description="Chat with other learners"
    >
      <div className="w-full h-[calc(100vh-200px)]">
        <div className="card h-full flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="input w-full pl-10"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="skeleton w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-32" />
                        <div className="skeleton h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start chatting by visiting someone's profile!</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition border-b border-gray-100 ${
                      selectedConversation?.id === conv.id ? 'bg-brand-50' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {conv.otherUser?.avatar ? (
                        <img src={conv.otherUser.avatar} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        conv.otherUser?.display_name?.charAt(0) || '?'
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.otherUser?.display_name || 'Unknown User'}
                        </h3>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(conv.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-brand-600 text-white rounded-full text-xs font-bold flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <Link
                    href={`/profile/${selectedConversation.otherUser?.user_id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedConversation.otherUser?.avatar ? (
                        <img src={selectedConversation.otherUser.avatar} alt="" className="w-full h-full rounded-full" />
                      ) : (
                        selectedConversation.otherUser?.display_name?.charAt(0) || '?'
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.otherUser?.display_name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        @{selectedConversation.otherUser?.username}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleDeleteConversation(selectedConversation.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages */}
                <div
                  id="messages-container"
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                >
                  {loadingMessages ? (
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
                    messages.map((message) => {
                      const isOwn = message.sender_id === currentUserId;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-md px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-brand-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? 'text-brand-200' : 'text-gray-500'
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
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="input flex-1"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="btn-primary"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                  <ChatBubbleLeftIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm mt-2">Choose a conversation from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}