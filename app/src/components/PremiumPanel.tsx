'use client';

import { useState } from 'react';
import { PREMIUM_FEATURES } from '@/lib/premium';
import toast from 'react-hot-toast';

interface PremiumPanelProps {
  onClose?: () => void;
}

export default function PremiumPanel({ onClose }: PremiumPanelProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = () => {
    setIsUpgrading(true);
    
    // Simulate upgrade process
    // In production, this would integrate with Stripe
    toast.loading('Opening payment page...', { duration: 2000 });
    
    setTimeout(() => {
      toast.success('Premium features coming soon! 🚀');
      setIsUpgrading(false);
      onClose?.();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold">✨ Upgrade to Premium</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 transition"
            >
              ×
            </button>
          </div>
          <p className="text-white/90">
            Unlock powerful features and take your knowledge graph to the next level
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <div className="border-2 border-gray-200 rounded-xl p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {PREMIUM_FEATURES.FREE.name}
              </h3>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                ${PREMIUM_FEATURES.FREE.price}
              </div>
              <div className="text-gray-500">Forever free</div>
            </div>
            <ul className="space-y-3 mb-6">
              {PREMIUM_FEATURES.FREE.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-3 bg-gray-200 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Premium Tier */}
          <div className="border-2 border-primary-500 rounded-xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
              BEST VALUE
            </div>
            <div className="text-center mb-6 mt-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {PREMIUM_FEATURES.PREMIUM.name}
              </h3>
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-4xl font-bold text-gray-900">
                  ${PREMIUM_FEATURES.PREMIUM.price}
                </span>
                <span className="text-gray-500">/{PREMIUM_FEATURES.PREMIUM.period}</span>
              </div>
              <div className="text-sm text-green-600 font-semibold">
                Save $30 with annual billing
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {PREMIUM_FEATURES.PREMIUM.features.map((feature, idx) => (
                <li
                  key={idx}
                  className={`flex items-start gap-2 ${
                    idx === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'
                  }`}
                >
                  <span className="text-primary-600 mt-1">
                    {idx === 0 ? '🎁' : '✓'}
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-lg font-bold text-lg transition shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {isUpgrading ? '⏳ Processing...' : '🚀 Upgrade Now'}
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="bg-gray-50 p-6 rounded-b-2xl border-t">
          <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600">
            <div>
              <div className="text-2xl mb-1">🔒</div>
              <div className="font-semibold">Secure Payment</div>
              <div className="text-xs">Powered by Stripe</div>
            </div>
            <div>
              <div className="text-2xl mb-1">↩️</div>
              <div className="font-semibold">30-Day Refund</div>
              <div className="text-xs">No questions asked</div>
            </div>
            <div>
              <div className="text-2xl mb-1">❌</div>
              <div className="font-semibold">Cancel Anytime</div>
              <div className="text-xs">No commitments</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}