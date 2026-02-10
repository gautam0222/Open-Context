import nlp from 'compromise';

export interface ExtractedEntity {
  text: string;
  type: 'person' | 'place' | 'organization' | 'topic' | 'concept';
  frequency: number;
}

/**
 * FAST entity extraction - optimized for speed
 */
export function extractEntities(text: string): ExtractedEntity[] {
  // Limit text size to prevent slowdown
  const maxLength = 10000; // ~2000 words
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;
  
  const doc = nlp(truncatedText);
  const entities: Map<string, ExtractedEntity> = new Map();

  // Extract people (FAST)
  const people = doc.people().json();
  people.forEach((item: any) => {
    const name = item.text.trim();
    if (name.length > 2 && name.length < 50) {
      const key = name.toLowerCase();
      if (entities.has(key)) {
        entities.get(key)!.frequency++;
      } else {
        entities.set(key, { text: name, type: 'person', frequency: 1 });
      }
    }
  });

  // Extract places (FAST)
  const places = doc.places().json();
  places.forEach((item: any) => {
    const name = item.text.trim();
    if (name.length > 2 && name.length < 50) {
      const key = name.toLowerCase();
      if (entities.has(key)) {
        entities.get(key)!.frequency++;
      } else {
        entities.set(key, { text: name, type: 'place', frequency: 1 });
      }
    }
  });

  // Extract organizations (FAST)
  const orgs = doc.organizations().json();
  orgs.forEach((item: any) => {
    const name = item.text.trim();
    if (name.length > 2 && name.length < 50) {
      const key = name.toLowerCase();
      if (entities.has(key)) {
        entities.get(key)!.frequency++;
      } else {
        entities.set(key, { text: name, type: 'organization', frequency: 1 });
      }
    }
  });

  // Extract top topics (FAST - only high frequency)
  const terms = doc.terms().json();
  const topicCount: Map<string, number> = new Map();
  
  terms.forEach((term: any) => {
    const text = term.text.toLowerCase().trim();
    // Only meaningful words (3+ chars, not too common)
    if (text.length >= 3 && text.length <= 30 && !isCommonWord(text) && /^[a-z\s]+$/.test(text)) {
      topicCount.set(text, (topicCount.get(text) || 0) + 1);
    }
  });

  // Only add topics mentioned 3+ times
  topicCount.forEach((count, topic) => {
    if (count >= 3 && !entities.has(topic)) {
      entities.set(topic, { text: topic, type: 'topic', frequency: count });
    }
  });

  // Return only top 20 entities (prevents graph overload)
  return Array.from(entities.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);
}

/**
 * FAST co-occurrence detection
 */
export function findCoOccurrences(
  entities: ExtractedEntity[],
  text: string
): Array<{ entity1: string; entity2: string; strength: number }> {
  const coOccurrences: Array<{ entity1: string; entity2: string; strength: number }> = [];
  
  // Limit to top 10 entities to prevent combinatorial explosion
  const topEntities = entities.slice(0, 10);
  
  for (let i = 0; i < topEntities.length; i++) {
    for (let j = i + 1; j < topEntities.length; j++) {
      const strength = Math.min(topEntities[i].frequency, topEntities[j].frequency) / 10;
      
      if (strength > 0.1) {
        coOccurrences.push({
          entity1: topEntities[i].text.toLowerCase(),
          entity2: topEntities[j].text.toLowerCase(),
          strength: Math.min(strength, 1.0),
        });
      }
    }
  }
  
  return coOccurrences.slice(0, 10); // Max 10 relationships per document
}

function isCommonWord(word: string): boolean {
  const common = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'time', 'year', 'work', 'way', 'day', 'thing', 'man', 'world', 'life',
    'hand', 'part', 'child', 'eye', 'woman', 'place', 'week', 'case', 'point',
  ]);
  return common.has(word);
}

export default {
  extractEntities,
  findCoOccurrences,
};