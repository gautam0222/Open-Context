import { getAllDocuments, getChunksByDocumentId } from './database';

export interface TopicCluster {
  topic: string;
  documentIds: string[];
  documentCount: number;
  totalWords: number;
  keywords: string[];
  timeRange: { earliest: number; latest: number };
}

export interface Timeline {
  date: string;
  documents: Array<{
    id: string;
    title: string;
    url: string;
    word_count: number;
    topics: string[];
  }>;
  topicsLearned: string[];
  totalWords: number;
}

export interface Insight {
  type: 'frequent_topic' | 'learning_pattern' | 'knowledge_gap' | 'reading_streak';
  title: string;
  description: string;
  data: any;
  importance: number;
}

/**
 * Analyze reading patterns and generate insights
 */
export async function generateInsights(): Promise<Insight[]> {
  const documents = getAllDocuments(1000);
  const insights: Insight[] = [];

  if (documents.length === 0) return insights;

  // 1. Reading frequency pattern
  const dates = documents.map(d => new Date(d.created_at).toDateString());
  const dateFreq = new Map<string, number>();
  dates.forEach(d => dateFreq.set(d, (dateFreq.get(d) || 0) + 1));

  const maxDay = Math.max(...Array.from(dateFreq.values()));
  if (maxDay >= 3) {
    const bestDay = Array.from(dateFreq.entries()).find(([_, count]) => count === maxDay)?.[0];
    insights.push({
      type: 'reading_streak',
      title: 'Peak Reading Day',
      description: `You captured ${maxDay} documents on ${bestDay}. You're on fire! 🔥`,
      data: { date: bestDay, count: maxDay },
      importance: 8,
    });
  }

  // 2. Total knowledge accumulated
  const totalWords = documents.reduce((sum, d) => sum + (d.word_count || 0), 0);
  const readingHours = Math.round(totalWords / 200 / 60 * 10) / 10; // 200 wpm

  insights.push({
    type: 'learning_pattern',
    title: 'Knowledge Accumulated',
    description: `You've captured ${totalWords.toLocaleString()} words - equivalent to ${readingHours} hours of reading time!`,
    data: { totalWords, readingHours, documentCount: documents.length },
    importance: 9,
  });

  // 3. Top domains
  const domains = new Map<string, number>();
  documents.forEach(d => {
    try {
      const domain = new URL(d.url).hostname.replace('www.', '');
      domains.set(domain, (domains.get(domain) || 0) + 1);
    } catch {}
  });

  const topDomain = Array.from(domains.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topDomain && topDomain[1] >= 3) {
    insights.push({
      type: 'frequent_topic',
      title: 'Favorite Source',
      description: `You've captured ${topDomain[1]} articles from ${topDomain[0]}`,
      data: { domain: topDomain[0], count: topDomain[1] },
      importance: 7,
    });
  }

  // 4. Recent growth
  const lastWeek = documents.filter(d => 
    Date.now() - d.created_at < 7 * 24 * 60 * 60 * 1000
  );
  
  if (lastWeek.length >= 5) {
    insights.push({
      type: 'reading_streak',
      title: 'Active Learning Week',
      description: `You captured ${lastWeek.length} documents this week! Keep the momentum going! 🚀`,
      data: { weekCount: lastWeek.length },
      importance: 10,
    });
  }

  // 5. Knowledge gaps (days without captures)
  const sortedDocs = documents.sort((a, b) => b.created_at - a.created_at);
  if (sortedDocs.length >= 2) {
    const daysSinceLastCapture = Math.floor(
      (Date.now() - sortedDocs[0].created_at) / (24 * 60 * 60 * 1000)
    );
    
    if (daysSinceLastCapture >= 3) {
      insights.push({
        type: 'knowledge_gap',
        title: 'Time to Learn',
        description: `It's been ${daysSinceLastCapture} days since your last capture. Found anything interesting lately?`,
        data: { daysSinceLastCapture },
        importance: 6,
      });
    }
  }

  return insights.sort((a, b) => b.importance - a.importance);
}

/**
 * Build timeline of learning
 */
export function buildTimeline(): Timeline[] {
  const documents = getAllDocuments(1000);
  const timelineMap = new Map<string, Timeline>();

  documents.forEach(doc => {
    const date = new Date(doc.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!timelineMap.has(date)) {
      timelineMap.set(date, {
        date,
        documents: [],
        topicsLearned: [],
        totalWords: 0,
      });
    }

    const timeline = timelineMap.get(date)!;
    timeline.documents.push({
      id: doc.id,
      title: doc.title || 'Untitled',
      url: doc.url,
      word_count: doc.word_count || 0,
      topics: [], // We'll enhance this later
    });
    timeline.totalWords += doc.word_count || 0;
  });

  return Array.from(timelineMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get reading statistics
 */
export function getReadingStats() {
  const documents = getAllDocuments(1000);
  
  const totalWords = documents.reduce((sum, d) => sum + (d.word_count || 0), 0);
  const totalDocs = documents.length;
  const avgWords = totalDocs > 0 ? Math.round(totalWords / totalDocs) : 0;
  
  // Calculate streak
  const sortedDocs = documents.sort((a, b) => b.created_at - a.created_at);
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const doc of sortedDocs) {
    const docDate = new Date(doc.created_at);
    docDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate.getTime() - docDate.getTime()) / (24 * 60 * 60 * 1000));
    
    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break;
    }
  }

  // Words per day
  const oldestDoc = sortedDocs[sortedDocs.length - 1];
  const daysSinceStart = oldestDoc 
    ? Math.max(1, Math.floor((Date.now() - oldestDoc.created_at) / (24 * 60 * 60 * 1000)))
    : 1;
  const wordsPerDay = Math.round(totalWords / daysSinceStart);

  return {
    totalWords,
    totalDocs,
    avgWords,
    streak,
    wordsPerDay,
    readingHours: Math.round(totalWords / 200 / 60 * 10) / 10,
  };
}

export default {
  generateInsights,
  buildTimeline,
  getReadingStats,
};