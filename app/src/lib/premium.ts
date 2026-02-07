export const PREMIUM_FEATURES = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Unlimited local documents',
      'Semantic search',
      'Export to JSON',
      'Export to Markdown',
      'Basic analytics',
      '100% local & private',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    price: 9,
    period: 'month',
    features: [
      'Everything in Free, plus:',
      '☁️ Cloud sync across devices',
      '📤 Export to PDF, Obsidian, Notion',
      '📊 Advanced analytics & insights',
      '🕸️ Interactive knowledge graph',
      '🤖 AI-powered Q&A chat',
      '⚡ Priority search (10x faster)',
      '🎨 Custom themes',
      '📱 Mobile app access',
      '🔔 Smart notifications',
      '💾 Unlimited cloud storage',
      '🛠️ API access',
    ],
  },
} as const;

export type PremiumTier = 'FREE' | 'PREMIUM';

export function isPremiumFeature(feature: string): boolean {
  const premiumFeatures = [
    'cloud-sync',
    'export-pdf',
    'export-obsidian',
    'export-notion',
    'advanced-analytics',
    'knowledge-graph',
    'ai-chat',
    'custom-themes',
    'mobile-app',
    'api-access',
  ];
  return premiumFeatures.includes(feature);
}

export function checkFeatureAccess(tier: PremiumTier, feature: string): boolean {
  if (tier === 'PREMIUM') return true;
  return !isPremiumFeature(feature);
}