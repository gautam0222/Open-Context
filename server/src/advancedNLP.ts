import { getAllDocuments } from './database';

export interface Entity {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'technology' | 'concept' | 'location' | 'date' | 'product';
  count: number;
  documentIds: string[];
  importance: number;
  aliases: string[];
  description?: string;
}

export interface Relationship {
  id: string;
  source: string; // entity ID
  target: string; // entity ID
  type: 'mentions' | 'influences' | 'part_of' | 'similar_to' | 'contradicts' | 'builds_on';
  strength: number;
  evidence: string[];
  documentIds: string[];
}

export interface ConceptGraph {
  entities: Entity[];
  relationships: Relationship[];
  clusters: EntityCluster[];
  timeline: TimelineEvent[];
}

export interface EntityCluster {
  id: string;
  name: string;
  entities: string[];
  centrality: number;
  description: string;
}

export interface TimelineEvent {
  date: number;
  entities: string[];
  documentId: string;
  importance: number;
}

/**
 * Extract named entities from all documents using NLP
 */
export async function extractEntitiesFromDocuments(): Promise<ConceptGraph> {
  console.log('🧠 Performing advanced NLP analysis...');

  const documents = getAllDocuments(1000);
  
  if (documents.length === 0) {
    return {
      entities: [],
      relationships: [],
      clusters: [],
      timeline: [],
    };
  }

  // Extract entities from each document
  const allEntities: Map<string, Entity> = new Map();
  const allRelationships: Relationship[] = [];

  for (const doc of documents) {
    // Skip if no content
    if (!doc.content || typeof doc.content !== 'string') {
      console.warn(`Skipping document ${doc.id} - no content`);
      continue;
    }
    
    const docEntities = await extractEntitiesFromText(doc.content, doc.id);
    
    // Merge entities
    for (const entity of docEntities) {
      const key = entity.name.toLowerCase();
      
      if (allEntities.has(key)) {
        const existing = allEntities.get(key)!;
        existing.count += entity.count;
        existing.documentIds.push(...entity.documentIds);
        existing.documentIds = [...new Set(existing.documentIds)];
      } else {
        allEntities.set(key, entity);
      }
    }

    // Extract relationships within document
    const docRelationships = extractRelationshipsFromText(doc.content, doc.id, docEntities);
    allRelationships.push(...docRelationships);
  }

  // Calculate entity importance
  const entities = Array.from(allEntities.values()).map(entity => ({
    ...entity,
    importance: calculateEntityImportance(entity, documents.length),
  }));

  // Find cross-document relationships
  const crossDocRelationships = findCrossDocumentRelationships(entities, documents);
  allRelationships.push(...crossDocRelationships);

  // Cluster entities
  const clusters = clusterEntities(entities, allRelationships);

  // Build timeline
  const timeline = buildEntityTimeline(entities, documents);
  // Remove relationships that reference non-existing entities
const entityIds = new Set(entities.map(e => e.id));

const validRelationships = allRelationships.filter(rel =>
  entityIds.has(rel.source) && entityIds.has(rel.target)
);


  console.log(`✅ Extracted ${entities.length} entities, ${allRelationships.length} relationships`);

  return {
    entities: entities.sort((a, b) => b.importance - a.importance),
    relationships: validRelationships,
    clusters,
    timeline,
  };
}

/**
 * Extract entities from text using pattern matching and NLP
 */
async function extractEntitiesFromText(text: string, documentId: string): Promise<Entity[]> {
  const entities: Map<string, Entity> = new Map();

  // Technology patterns
  const techPatterns = [
    /\b(AI|ML|machine learning|deep learning|neural network|GPT|LLM|transformer|BERT|CNN|RNN|NLP)\b/gi,
    /\b(React|Vue|Angular|Node\.js|Python|JavaScript|TypeScript|Java|C\+\+|Rust|Go)\b/g,
    /\b(Docker|Kubernetes|AWS|Azure|GCP|PostgreSQL|MongoDB|Redis|Kafka)\b/g,
    /\b(blockchain|cryptocurrency|Bitcoin|Ethereum|smart contract|NFT|DeFi|Web3)\b/gi,
  ];

  // Company patterns
  const companyPatterns = [
    /\b(Google|Microsoft|Apple|Amazon|Meta|Facebook|Tesla|OpenAI|Anthropic|DeepMind)\b/g,
    /\b(Netflix|Spotify|Uber|Airbnb|Stripe|Shopify|Salesforce|Oracle)\b/g,
  ];

  // People patterns (titles + names)
  const peoplePatterns = [
    /\b(Dr\.|Prof\.|CEO|CTO|Mr\.|Ms\.|President)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(said|wrote|developed|created|founded|invented)\b/g,
  ];

  // Concept patterns
  const conceptPatterns = [
    /\b(productivity|efficiency|optimization|innovation|disruption|transformation|scalability)\b/gi,
    /\b(leadership|management|strategy|vision|mission|culture|values)\b/gi,
    /\b(sustainability|climate|renewable|environment|carbon|emissions)\b/gi,
  ];

  // Extract technologies
  for (const pattern of techPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      addEntity(entities, match[0], 'technology', documentId);
    }
  }

  // Extract companies
  for (const pattern of companyPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      addEntity(entities, match[0], 'organization', documentId);
    }
  }

  // Extract people
  for (const pattern of peoplePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const name = match[2] || match[1];
      if (name && name.length > 3) {
        addEntity(entities, name, 'person', documentId);
      }
    }
  }

  // Extract concepts
  for (const pattern of conceptPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      addEntity(entities, match[0], 'concept', documentId);
    }
  }

  // Extract capitalized phrases (potential entities)
  const capitalizedPhrases = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g) || [];
  for (const phrase of capitalizedPhrases) {
    if (phrase.length > 5 && !isCommonPhrase(phrase)) {
      addEntity(entities, phrase, 'concept', documentId);
    }
  }

  return Array.from(entities.values());
}

function addEntity(
  entities: Map<string, Entity>,
  name: string,
  type: Entity['type'],
  documentId: string
): void {
  const key = name.toLowerCase();
  
  if (entities.has(key)) {
    const entity = entities.get(key)!;
    entity.count++;
    if (!entity.documentIds.includes(documentId)) {
      entity.documentIds.push(documentId);
    }
  } else {
    entities.set(key, {
      id: `entity_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name: name,
      type,
      count: 1,
      documentIds: [documentId],
      importance: 0,
      aliases: [],
    });
  }
}

/**
 * Extract relationships between entities in text
 */
function extractRelationshipsFromText(
  text: string,
  documentId: string,
  entities: Entity[]
): Relationship[] {
  const relationships: Relationship[] = [];

  // Find co-occurrences (entities mentioned in same sentence)
  const sentences = text.split(/[.!?]+/);

  for (const sentence of sentences) {
    const mentionedEntities = entities.filter(e =>
      sentence.toLowerCase().includes(e.name.toLowerCase())
    );

    // Create relationships for co-occurring entities
    for (let i = 0; i < mentionedEntities.length; i++) {
      for (let j = i + 1; j < mentionedEntities.length; j++) {
        const source = mentionedEntities[i];
        const target = mentionedEntities[j];

        // Determine relationship type based on context
        let relType: Relationship['type'] = 'mentions';
        
        if (sentence.match(/\b(uses|powered by|built with|based on)\b/i)) {
          relType = 'builds_on';
        } else if (sentence.match(/\b(similar|like|comparable|related)\b/i)) {
          relType = 'similar_to';
        } else if (sentence.match(/\b(influences|impacts|affects|drives)\b/i)) {
          relType = 'influences';
        }

        relationships.push({
          id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: source.id,
          target: target.id,
          type: relType,
          strength: 1,
          evidence: [sentence.trim()],
          documentIds: [documentId],
        });
      }
    }
  }

  return relationships;
}

/**
 * Find relationships across documents
 */
function findCrossDocumentRelationships(entities: Entity[], documents: any[]): Relationship[] {
  const relationships: Relationship[] = [];

  // Find entities that appear together in multiple documents
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entity1 = entities[i];
      const entity2 = entities[j];

      const sharedDocs = entity1.documentIds.filter(id =>
        entity2.documentIds.includes(id)
      );

      if (sharedDocs.length >= 2) {
        relationships.push({
          id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: entity1.id,
          target: entity2.id,
          type: 'mentions',
          strength: sharedDocs.length,
          evidence: [`Mentioned together in ${sharedDocs.length} documents`],
          documentIds: sharedDocs,
        });
      }
    }
  }

  return relationships;
}

/**
 * Calculate entity importance score
 */
function calculateEntityImportance(entity: Entity, totalDocs: number): number {
  // TF-IDF style scoring
  const tf = entity.count; // Term frequency
  const df = entity.documentIds.length; // Document frequency
  const idf = Math.log(totalDocs / (df + 1)); // Inverse document frequency

  // Combine metrics
  const score = tf * idf * (df / totalDocs);

  return Math.round(score * 100) / 100;
}

/**
 * Cluster entities into groups
 */
function clusterEntities(entities: Entity[], relationships: Relationship[]): EntityCluster[] {
  const clusters: EntityCluster[] = [];

  // Simple clustering: group by type and co-occurrence
  const typeGroups = new Map<string, Entity[]>();

  for (const entity of entities) {
    if (!typeGroups.has(entity.type)) {
      typeGroups.set(entity.type, []);
    }
    typeGroups.get(entity.type)!.push(entity);
  }

  let clusterIndex = 0;
  for (const [type, groupEntities] of typeGroups.entries()) {
    if (groupEntities.length === 0) continue;

    clusters.push({
      id: `cluster_${clusterIndex++}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Cluster`,
      entities: groupEntities.map(e => e.id),
      centrality: groupEntities.reduce((sum, e) => sum + e.importance, 0),
      description: `Group of ${groupEntities.length} ${type}s`,
    });
  }

  return clusters;
}

/**
 * Build timeline of entity appearances
 */
function buildEntityTimeline(entities: Entity[], documents: any[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const doc of documents) {
    const docEntities = entities.filter(e => e.documentIds.includes(doc.id));

    if (docEntities.length > 0) {
      events.push({
        date: doc.created_at,
        entities: docEntities.map(e => e.id),
        documentId: doc.id,
        importance: docEntities.reduce((sum, e) => sum + e.importance, 0),
      });
    }
  }

  return events.sort((a, b) => a.date - b.date);
}

function isCommonPhrase(phrase: string): boolean {
  const common = new Set([
    'The First', 'The Second', 'The Third', 'This Is', 'These Are',
    'There Is', 'There Are', 'It Was', 'They Were', 'He Said',
  ]);
  return common.has(phrase);
}

export default {
  extractEntitiesFromDocuments,
};