'use client';

import { useState, useRef, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Link from 'next/link';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  DocumentTextIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  reasoning?: string;
  content: string;
  sources?: Array<{
    documentId: string;
    documentTitle: string;
    chunkContent: string;
    similarity: number;
  }>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
  if (!input.trim() || loading) return;

  const userMessage: Message = {
    role: 'user',
    content: input,
  };

  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setLoading(true);

  try {
    const history = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: input,
        history,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Chat failed');
    }

    const data = await response.json();

    const assistantMessage: Message = {
      role: 'assistant',
      content: data.answer,
      sources: data.sources,
      reasoning: data.reasoning,
    };

    setMessages(prev => [...prev, assistantMessage]);
  } catch (error) {
    console.error('Chat error:', error);
    
    // User-friendly error messages
    let errorMessage = 'Failed to get answer.';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = '🔑 OpenRouter API key not set. Add it in Settings!';
      } else if (error.message.includes('Embedding server')) {
        errorMessage = '⚠️ Embedding server not running. Start: python scripts/embedding_server.py';
      } else if (error.message.includes('No relevant information')) {
        errorMessage = '📚 No relevant documents found. Try capturing content related to your question.';
      } else {
        errorMessage = error.message;
      }
    }
    
    toast.error(errorMessage, { duration: 5000 });
  } finally {
    setLoading(false);
  }
};

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (confirm('Clear all messages?')) {
      setMessages([]);
      toast.success('Chat cleared');
    }
  };

  return (
    <MainLayout
      title="AI Chat"
      description="Ask questions about your captured content"
      headerActions={
        messages.length > 0 && (
          <button onClick={clearChat} className="btn-ghost text-error-600">
            <TrashIcon className="w-4 h-4" />
            Clear Chat
          </button>
        )
      }
    >
      <div className="h-[calc(100vh-12rem)] flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="card p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
                <SparklesIcon className="w-10 h-10 text-brand-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Chat with Your Knowledge</h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Ask questions about your captured documents. I'll search through your library and provide answers with sources.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                <button
                  onClick={() => setInput("What are the main topics I've been reading about?")}
                  className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                >
                  <div className="font-medium text-gray-900 group-hover:text-brand-600 mb-1">
                    📚 Explore Topics
                  </div>
                  <div className="text-sm text-gray-600">
                    What are the main topics I've been reading about?
                  </div>
                </button>

                <button
                  onClick={() => setInput("Summarize the key insights from my recent captures")}
                  className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                >
                  <div className="font-medium text-gray-900 group-hover:text-brand-600 mb-1">
                    ✨ Get Insights
                  </div>
                  <div className="text-sm text-gray-600">
                    Summarize the key insights from my recent captures
                  </div>
                </button>

                <button
                  onClick={() => setInput("What have I learned about AI recently?")}
                  className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                >
                  <div className="font-medium text-gray-900 group-hover:text-brand-600 mb-1">
                    🔍 Search Topics
                  </div>
                  <div className="text-sm text-gray-600">
                    What have I learned about AI recently?
                  </div>
                </button>

                <button
                  onClick={() => setInput("Compare the different perspectives in my documents")}
                  className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                >
                  <div className="font-medium text-gray-900 group-hover:text-brand-600 mb-1">
                    🔄 Compare Views
                  </div>
                  <div className="text-sm text-gray-600">
                    Compare the different perspectives in my documents
                  </div>
                </button>
              </div>

              <div className="mt-8 p-4 bg-amber-50 rounded-lg max-w-md">
                <div className="text-sm text-amber-800">
                  <strong>Note:</strong> Make sure you have the ANTHROPIC_API_KEY set in your server's .env file to use this feature.
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl ${
                    message.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-gray-200'
                  } rounded-2xl p-4 shadow-sm`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon className="w-5 h-5 text-brand-600" />
                      <span className="font-semibold text-gray-900">AI Assistant</span>
                    </div>
                  )}

                  <div
                    className={`prose prose-sm max-w-none ${
                      message.role === 'user' ? 'prose-invert' : ''
                    }`}
                  >
                    {message.content}
                  </div>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        📚 Sources ({message.sources.length}):
                      </div>
                      <div className="space-y-2">
                        {message.sources.map((source, sourceIdx) => (
                          <Link
                            key={sourceIdx}
                            href={`/library/${source.documentId}`}
                            className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                          >
                            <div className="flex items-start gap-2">
                              <DocumentTextIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 group-hover:text-brand-600 text-sm truncate">
                                  {source.documentTitle}
                                </div>
                                <div className="text-xs text-gray-600 line-clamp-2 mt-1">
                                  {source.chunkContent}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {(source.similarity * 100).toFixed(0)}% relevant
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm text-gray-600 ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="card p-4 sticky bottom-0">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about your captured content..."
              className="flex-1 input resize-none"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn-primary self-end"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </MainLayout>
  );
}