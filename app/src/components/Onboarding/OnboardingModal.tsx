'use client';

import { useState } from 'react';
import {
  SparklesIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChatBubbleBottomCenterTextIcon,
  ChartBarIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Open Context',
      description: 'Your AI-powered second brain for capturing, organizing, and exploring knowledge.',
      icon: <SparklesIcon className="w-16 h-16 text-brand-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-brand-50 to-purple-50 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">What makes Open Context special?</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>100% Private:</strong> Everything stored locally on your device</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>AI-Powered:</strong> Semantic search, chat with your docs, auto-insights</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Lightning Fast:</strong> Search 1000+ documents in under 1 second</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Free Forever:</strong> Core features completely free, no hidden costs</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Capture Anything, Anywhere',
      description: 'Save web pages, PDFs, and notes with one click.',
      icon: <DocumentTextIcon className="w-16 h-16 text-brand-600" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">🌐</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Browser Extension</h4>
              <p className="text-sm text-gray-600">Right-click any page → Save to Open Context</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">📄</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Upload Files</h4>
              <p className="text-sm text-gray-600">PDF, DOCX, TXT - we handle it all</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">✍️</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Quick Notes</h4>
              <p className="text-sm text-gray-600">Create notes directly in the app</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">📚</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Import</h4>
              <p className="text-sm text-gray-600">From Pocket, Instapaper, bookmarks</p>
            </div>
          </div>
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg">
            <p className="text-sm text-brand-800">
              <strong>💡 Pro Tip:</strong> Install the browser extension after onboarding for the best experience!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Search Like Magic',
      description: 'Find anything instantly with AI-powered semantic search.',
      icon: <MagnifyingGlassIcon className="w-16 h-16 text-brand-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">Semantic Search = Mind Reading</h3>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Instead of searching for:</div>
                <div className="font-mono text-sm text-gray-600">"productivity tips"</div>
                <div className="text-xs text-green-600 mt-2">✓ Try asking natural questions:</div>
                <div className="font-mono text-sm text-gray-900">"How can I get more done in less time?"</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Search by concept:</div>
                <div className="font-mono text-sm text-gray-900">"ways to improve focus"</div>
                <div className="text-xs text-brand-600 mt-2">→ Finds related content even without exact words!</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <SparklesIcon className="w-5 h-5 text-brand-600" />
            <span>Search speed: <strong>&lt;500ms</strong> even with 1000+ documents</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Chat With Your Knowledge',
      description: 'Ask questions and get answers from your saved content.',
      icon: <ChatBubbleBottomCenterTextIcon className="w-16 h-16 text-brand-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">AI Chat Examples:</h3>
            <div className="space-y-2">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">💬 "What have I learned about AI?"</div>
                <div className="text-xs text-gray-600">→ Summarizes all AI-related content you've saved</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">💬 "What are the main topics I've been reading about?"</div>
                <div className="text-xs text-gray-600">→ Analyzes and groups your content by theme</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">💬 "Compare the different perspectives in my documents"</div>
                <div className="text-xs text-gray-600">→ Finds and contrasts different viewpoints</div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>🔑 Setup Required:</strong> Add your OpenRouter API key in Settings → Free tier available!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Track Your Learning',
      description: 'Get insights, streaks, and achievements.',
      icon: <ChartBarIcon className="w-16 h-16 text-brand-600" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl">
              <div className="text-3xl mb-2">🔥</div>
              <h4 className="font-semibold text-gray-900 mb-1">Streaks</h4>
              <p className="text-sm text-gray-600">Build daily learning habits</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-900 mb-1">Analytics</h4>
              <p className="text-sm text-gray-600">See reading patterns & trends</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl">
              <div className="text-3xl mb-2">🏆</div>
              <h4 className="font-semibold text-gray-900 mb-1">Achievements</h4>
              <p className="text-sm text-gray-600">Unlock badges & milestones</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-xl">
              <div className="text-3xl mb-2">💡</div>
              <h4 className="font-semibold text-gray-900 mb-1">AI Insights</h4>
              <p className="text-sm text-gray-600">Discover patterns you didn't know</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Ready to Get Started!',
      description: "Let's add some sample content so you can try everything out.",
      icon: <RocketLaunchIcon className="w-16 h-16 text-brand-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-brand-50 to-purple-50 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">We'll set you up with:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>10 curated sample articles (AI, productivity, technology)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Pre-processed embeddings (instant search ready)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Interactive tutorial overlays</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Keyboard shortcuts cheat sheet</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                localStorage.setItem('skip_sample_content', 'true');
                onComplete();
              }}
              className="btn-ghost"
            >
              Skip Sample Content
            </button>
            <button
              onClick={async () => {
                // Will trigger sample content import
                localStorage.setItem('import_sample_content', 'true');
                onComplete();
              }}
              className="btn-primary"
            >
              Add Sample Content →
            </button>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    idx <= step ? 'bg-brand-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              {currentStep.icon}
            </div>
            <div>
              <div className="text-sm text-gray-500">Step {step + 1} of {steps.length}</div>
              <h2 className="text-2xl font-bold text-gray-900">{currentStep.title}</h2>
              <p className="text-gray-600">{currentStep.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {currentStep.content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          <div className="text-sm text-gray-500">
            {step + 1} / {steps.length}
          </div>

          {isLastStep ? (
            <button onClick={onComplete} className="btn-primary">
              Get Started! 🚀
            </button>
          ) : (
            <button onClick={() => setStep(step + 1)} className="btn-primary">
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}