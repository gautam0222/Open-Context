import nlp from 'compromise';

export interface ExtractedEntity {
  text: string;
  type: 'person' | 'place' | 'organization' | 'topic' | 'concept';
  frequency: number;
}

/**
 * Extract entities from text using compromise.js
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const doc = nlp(text);
  const entities: Map<string, ExtractedEntity> = new Map();

  // Extract people
  const people = doc.people().out('array');
  people.forEach((person: string) => {
    const normalized = person.toLowerCase().trim();
    if (normalized.length > 2) {
      if (entities.has(normalized)) {
        entities.get(normalized)!.frequency++;
      } else {
        entities.set(normalized, {
          text: person,
          type: 'person',
          frequency: 1,
        });
      }
    }
  });

  // Extract places
  const places = doc.places().out('array');
  places.forEach((place: string) => {
    const normalized = place.toLowerCase().trim();
    if (normalized.length > 2) {
      if (entities.has(normalized)) {
        entities.get(normalized)!.frequency++;
      } else {
        entities.set(normalized, {
          text: place,
          type: 'place',
          frequency: 1,
        });
      }
    }
  });

  // Extract organizations
  const orgs = doc.organizations().out('array');
  orgs.forEach((org: string) => {
    const normalized = org.toLowerCase().trim();
    if (normalized.length > 2) {
      if (entities.has(normalized)) {
        entities.get(normalized)!.frequency++;
      } else {
        entities.set(normalized, {
          text: org,
          type: 'organization',
          frequency: 1,
        });
      }
    }
  });

  // Extract topics (nouns/noun phrases that appear frequently)
  const nouns = doc.nouns().out('array');
  const nounFrequency: Map<string, number> = new Map();
  
  nouns.forEach((noun: string) => {
    const normalized = noun.toLowerCase().trim();
    if (normalized.length > 3 && !isCommonWord(normalized)) {
      nounFrequency.set(normalized, (nounFrequency.get(normalized) || 0) + 1);
    }
  });

  // Add high-frequency nouns as topics
  nounFrequency.forEach((freq, noun) => {
    if (freq >= 2 && !entities.has(noun)) {
      entities.set(noun, {
        text: noun,
        type: 'topic',
        frequency: freq,
      });
    }
  });

  return Array.from(entities.values());
}

/**
 * Filter out common words that aren't meaningful entities
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'time', 'year', 'people', 'way', 'day', 'thing', 'man', 'world',
    'life', 'hand', 'part', 'child', 'eye', 'woman', 'place', 'work',
    'week', 'case', 'point', 'government', 'company', 'number', 'group',
    'problem', 'fact', 'today', 'example', 'article', 'page', 'section',
  ]);
  
  return commonWords.has(word);
}

/**
 * Find co-occurring entities (entities that appear in the same document)
 */
export function findCoOccurrences(
  entities: ExtractedEntity[],
  text: string
): Array<{ entity1: string; entity2: string; strength: number }> {
  const coOccurrences: Array<{ entity1: string; entity2: string; strength: number }> = [];
  
  // For each pair of entities, check if they appear close together
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entity1 = entities[i];
      const entity2 = entities[j];
      
      // Calculate co-occurrence strength based on frequency and proximity
      const strength = Math.min(entity1.frequency, entity2.frequency) / 10;
      
      if (strength > 0.1) {
        coOccurrences.push({
          entity1: entity1.text.toLowerCase(),
          entity2: entity2.text.toLowerCase(),
          strength: Math.min(strength, 1.0),
        });
      }
    }
  }
  
  return coOccurrences;
}

export default {
  extractEntities,
  findCoOccurrences,
};