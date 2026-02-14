import { getDocumentsByDateRange, getUserProfile, DocumentRow } from './database';

export interface DigestItem {
  type: 'summary' | 'insight' | 'recommendation' | 'streak' | 'achievement';
  title: string;
  content: string;
  icon: string;
  priority: number;
}

/**
 * Generate personalized daily digest for user
 */
export function generateDailyDigest(userId: string): DigestItem[] {
  const digest: DigestItem[] = [];
  const profile = getUserProfile(userId);

  if (!profile) return [];

  // Get yesterday's activity
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  const recentDocs = getDocumentsByDateRange(yesterday, Date.now());

  // 1. Activity Summary
  if (recentDocs.length > 0) {
    const totalWords = recentDocs.reduce((sum, doc) => {
      const wordCount = typeof doc.word_count === 'number' ? doc.word_count : 0;
      return sum + wordCount;
    }, 0);

    digest.push({
      type: 'summary',
      title: '📊 Yesterday\'s Activity',
      content: `You captured ${recentDocs.length} documents and read ${totalWords.toLocaleString()} words. Great work!`,
      icon: '📈',
      priority: 10,
    });
  }

  // 2. Streak Status
  if (profile.streak_days > 0) {
    digest.push({
      type: 'streak',
      title: '🔥 Streak Alert',
      content: `You're on a ${profile.streak_days}-day streak! Keep it going by capturing content today.`,
      icon: '🔥',
      priority: 9,
    });
  }

  // 3. Level Progress
  const nextLevelXP = (profile.level + 1) ** 2 * 100;
  const xpNeeded = nextLevelXP - profile.xp;
  
  if (xpNeeded < 100) {
    digest.push({
      type: 'insight',
      title: '🎯 Almost There!',
      content: `You need just ${xpNeeded} XP to reach Level ${profile.level + 1}. Capture a few more documents today!`,
      icon: '🎯',
      priority: 8,
    });
  }

  // 4. Review Reminder
  const oldDocs = getDocumentsByDateRange(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
    Date.now() - 5 * 24 * 60 * 60 * 1000
  );

  if (oldDocs.length > 0) {
    digest.push({
      type: 'recommendation',
      title: '📚 Time to Review',
      content: `You haven't reviewed "${oldDocs[0].title}" in 5 days. Spaced repetition helps retention!`,
      icon: '🔄',
      priority: 7,
    });
  }

  // 5. Learning Recommendation
  if (recentDocs.length > 3) {
    const topics = extractTopics(recentDocs);
    if (topics.length > 0) {
      digest.push({
        type: 'recommendation',
        title: '💡 Based on Your Interests',
        content: `You've been reading a lot about ${topics[0]}. Here are some related topics to explore: ${topics.slice(1, 3).join(', ')}`,
        icon: '🎓',
        priority: 6,
      });
    }
  }

  // 6. Achievement Close
  digest.push({
    type: 'achievement',
    title: '🏆 Achievement in Sight',
    content: `You're ${10 - profile.total_documents} documents away from unlocking "Early Bird" achievement!`,
    icon: '🎖️',
    priority: 5,
  });

  return digest.sort((a, b) => b.priority - a.priority);
}

function extractTopics(docs: DocumentRow[]): string[] {
  const keywords = new Map<string, number>();

  docs.forEach(doc => {
    const words = (doc.title ?? '').toLowerCase().split(/\s+/);
    words.forEach((word: string) => {
      if (word.length > 4) {
        keywords.set(word, (keywords.get(word) || 0) + 1);
      }
    });
  });

  return Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}