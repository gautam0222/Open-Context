// Change the import
import { generateId as genId } from '@open-context/shared'

// Or just use a different approach
export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  coin_reward: number;
  active_date: string;
  difficulty: string;
  icon: string;
}

/**
 * Generate daily challenges
 */
export function generateDailyChallenges(): DailyChallenge[] {
  const today = new Date().toISOString().split('T')[0];

  const challenges: DailyChallenge[] = [
    {
      id: `challenge_${Date.now()}_1`,
      title: 'Early Bird',
      description: 'Capture 3 documents today',
      challenge_type: 'capture',
      target_value: 3,
      xp_reward: 50,
      coin_reward: 25,
      active_date: today,
      difficulty: 'easy',
      icon: '🐦',
    },
    {
      id: `challenge_${Date.now()}_2`,
      title: 'Speed Reader',
      description: 'Read 5,000 words today',
      challenge_type: 'words',
      target_value: 5000,
      xp_reward: 100,
      coin_reward: 50,
      active_date: today,
      difficulty: 'medium',
      icon: '📚',
    },
    {
      id: `challenge_${Date.now()}_3`,
      title: 'Goal Crusher',
      description: 'Make progress on 2 learning goals',
      challenge_type: 'goals',
      target_value: 2,
      xp_reward: 75,
      coin_reward: 35,
      active_date: today,
      difficulty: 'easy',
      icon: '🎯',
    },
    {
      id: `challenge_${Date.now()}_4`,
      title: 'Social Butterfly',
      description: 'Share 1 collection with a workspace',
      challenge_type: 'social',
      target_value: 1,
      xp_reward: 60,
      coin_reward: 30,
      active_date: today,
      difficulty: 'easy',
      icon: '🦋',
    },
    {
      id: `challenge_${Date.now()}_5`,
      title: 'Knowledge Explorer',
      description: 'Use the Concept Graph',
      challenge_type: 'explore',
      target_value: 1,
      xp_reward: 40,
      coin_reward: 20,
      active_date: today,
      difficulty: 'easy',
      icon: '🔍',
    },
  ];

  return challenges;
}

/**
 * Check if user completed a challenge
 */
export function checkChallengeProgress(
  challenge: DailyChallenge,
  userActivity: any
): number {
  switch (challenge.challenge_type) {
    case 'capture':
      return userActivity.capturedToday || 0;
    case 'words':
      return userActivity.wordsReadToday || 0;
    case 'goals':
      return userActivity.goalsProgressedToday || 0;
    case 'social':
      return userActivity.collectionsSharedToday || 0;
    case 'explore':
      return userActivity.graphVisitedToday ? 1 : 0;
    default:
      return 0;
  }
}