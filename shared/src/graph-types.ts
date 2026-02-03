/**
 * Knowledge graph node types
 */
export enum NodeType {
  DOCUMENT = 'document',
  CONCEPT = 'concept',
  ENTITY = 'entity',
  TAG = 'tag',
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  frequency?: number;
  lastSeen?: number;
  metadata?: Record<string, any>;
}

/**
 * Knowledge graph edge types
 */
export enum EdgeType {
  MENTIONS = 'mentions',
  RELATED_TO = 'related_to',
  SIMILAR_TO = 'similar_to',
  CONTAINS = 'contains',
  CITES = 'cites',
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight?: number;
  metadata?: Record<string, any>;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Concept extraction result
 */
export interface Concept {
  id: string;
  label: string;
  entityType?: string; // PERSON, ORG, GPE, etc.
  frequency: number;
  documentIds: string[];
}