import { getAllDocuments, getChunksByDocumentId } from './database';

export interface Topic {
  id: string;
  name: string;
  category: string;
  documentIds: string[];
  documentCount: number;
  totalWords: number;
  keywords: string[];
  summary: string;
  createdAt: number;
  lastUpdated: number;
}

export interface TopicConnection {
  topic1: string;
  topic2: string;
  strength: number;
  sharedDocuments: number;
}

/**
 * Extract topics using embedding clustering
 */
export async function extractTopicsFromDocuments(): Promise<Topic[]> {
  console.log('🧠 Extracting topics using AI clustering...');

  const documents = getAllDocuments(1000);
  
  if (documents.length === 0) {
    return [];
  }

  // Group documents by semantic similarity of their first chunks
  const documentEmbeddings = documents.map(doc => {
    const chunks = getChunksByDocumentId(doc.id);
    if (chunks.length === 0 || !chunks[0].embedding) {
      return null;
    }
    return {
      docId: doc.id,
      title: doc.title,
      embedding: JSON.parse(chunks[0].embedding),
      wordCount: doc.word_count || 0,
      createdAt: doc.created_at,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  // Simple clustering algorithm (k-means style)
  const topics = await clusterDocuments(documentEmbeddings);

  console.log(`✅ Extracted ${topics.length} topics`);
  return topics;
}

/**
 * Cluster documents into topics using embedding similarity
 */
async function clusterDocuments(docs: any[]): Promise<Topic[]> {
  if (docs.length === 0) return [];

  const topics: Topic[] = [];
  const assigned = new Set<string>();

  // Use similarity threshold clustering
  const similarityThreshold = 0.7;

  for (const doc of docs) {
    if (assigned.has(doc.docId)) continue;

    // Find all similar documents
    const cluster = [doc];
    assigned.add(doc.docId);

    for (const otherDoc of docs) {
      if (assigned.has(otherDoc.docId)) continue;

      const similarity = cosineSimilarity(doc.embedding, otherDoc.embedding);

      if (similarity >= similarityThreshold) {
        cluster.push(otherDoc);
        assigned.add(otherDoc.docId);
      }
    }

    // Create topic from cluster
    if (cluster.length > 0) {
      const topicName = await generateTopicName(cluster);
      const category = categorizeTopicName(topicName);
      
      topics.push({
        id: `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: topicName,
        category,
        documentIds: cluster.map(d => d.docId),
        documentCount: cluster.length,
        totalWords: cluster.reduce((sum, d) => sum + d.wordCount, 0),
        keywords: extractKeywords(cluster),
        summary: `Collection of ${cluster.length} documents about ${topicName.toLowerCase()}`,
        createdAt: Math.min(...cluster.map(d => d.createdAt)),
        lastUpdated: Math.max(...cluster.map(d => d.createdAt)),
      });
    }
  }

  return topics;
}

/**
 * Generate topic name from document titles
 */
async function generateTopicName(cluster: any[]): Promise<string> {
  const titles = cluster.map(d => d.title).join(' ');
  const words = titles.toLowerCase().split(/\s+/);
  
  // Count word frequency
  const wordCount = new Map<string, number>();
  
  for (const word of words) {
    if (word.length < 4) continue;
    if (isCommonWord(word)) continue;
    
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  // Get top words
  const topWords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  if (topWords.length === 0) return 'General';

  // Capitalize and combine
  return topWords
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' & ');
}

/**
 * Categorize topic into broad category
 */
function categorizeTopicName(topicName: string): string {
  const name = topicName.toLowerCase();

  const categories: Record<string, string[]> = {
    'Technology': ['ai', 'software', 'code', 'programming', 'tech', 'computer', 'data', 'machine', 'learning', 'algorithm'],
    'Science': ['science', 'research', 'study', 'biology', 'physics', 'chemistry', 'medical', 'health'],
    'Business': ['business', 'startup', 'market', 'company', 'finance', 'money', 'invest', 'entrepreneur'],
    'Personal': ['productivity', 'life', 'habit', 'skill', 'learn', 'self', 'mind', 'mental', 'health'],
    'Creative': ['design', 'art', 'creative', 'writing', 'music', 'film', 'photo'],
    'Education': ['education', 'teach', 'course', 'university', 'school', 'student'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }

  return 'General';
}

/**
 * Extract keywords from cluster
 */
function extractKeywords(cluster: any[]): string[] {
  const allWords = cluster
    .map(d => d.title)
    .join(' ')
    .toLowerCase()
    .split(/\s+/);

  const wordCount = new Map<string, number>();

  for (const word of allWords) {
    if (word.length < 4) continue;
    if (isCommonWord(word)) continue;
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Find connections between topics
 */
export function findTopicConnections(topics: Topic[]): TopicConnection[] {
  const connections: TopicConnection[] = [];

  for (let i = 0; i < topics.length; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const topic1 = topics[i];
      const topic2 = topics[j];

      // Find shared documents
      const sharedDocs = topic1.documentIds.filter(id =>
        topic2.documentIds.includes(id)
      );

      if (sharedDocs.length > 0) {
        const strength = sharedDocs.length / Math.min(topic1.documentCount, topic2.documentCount);

        connections.push({
          topic1: topic1.id,
          topic2: topic2.id,
          strength,
          sharedDocuments: sharedDocs.length,
        });
      }
    }
  }

  return connections.sort((a, b) => b.strength - a.strength);
}

/**
 * Get topic timeline (when topics were created)
 */
export function getTopicTimeline(topics: Topic[]): Map<string, Topic[]> {
  const timeline = new Map<string, Topic[]>();

  for (const topic of topics) {
    const date = new Date(topic.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!timeline.has(monthKey)) {
      timeline.set(monthKey, []);
    }

    timeline.get(monthKey)!.push(topic);
  }

  return timeline;
}

// Helper functions
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

function isCommonWord(word: string): boolean {
  const common = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
    'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
    'their', 'what', 'time', 'year', 'work', 'way', 'day', 'thing',
  ]);
  return common.has(word);
}

export default {
  extractTopicsFromDocuments,
  findTopicConnections,
  getTopicTimeline,
};