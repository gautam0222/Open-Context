'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import NetworkGraph from '@/components/KnowledgeGraph/NetworkGraph';
import EntityExplorer from '@/components/KnowledgeGraph/EntityExplorer';
import RelationshipExplorer from '@/components/KnowledgeGraph/RelationshipExplorer';
import {
  ArrowPathIcon,
  SparklesIcon,
  XMarkIcon,
  DocumentTextIcon,
  CpuChipIcon,
  LinkIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Entity {
  id: string;
  name: string;
  type: string;
  count: number;
  importance: number;
  documentIds: string[];
  keywords?: string[];
}

interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  evidence: string[];
  documentIds: string[];
}

interface ConceptGraphData {
  entities: Entity[];
  relationships: Relationship[];
  clusters: any[];
  timeline: any[];
  insights: any[];
  stats: {
    totalEntities: number;
    totalRelationships: number;
    totalClusters: number;
    entityTypes: Record<string, number>;
  };
}

interface EntityDetails {
  entity: Entity;
  relatedEntities: Entity[];
  relationships: Relationship[];
  documents: any[];
}

export default function ConceptGraphPage() {
  const [graphData, setGraphData] = useState<ConceptGraphData | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'network' | 'list'>('network');

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/concept-graph');
      
      if (!response.ok) {
        throw new Error('Failed to load graph');
      }

      const data = await response.json();
      setGraphData(data);

      if (data.entities && data.entities.length > 0) {
        toast.success(`🧠 Discovered ${data.entities.length} concepts!`);
      }
    } catch (error) {
      console.error('Failed to load concept graph:', error);
      toast.error('Failed to load concept graph');
    } finally {
      setLoading(false);
    }
  };

  const handleEntityClick = async (entity: Entity) => {
    try {
      const response = await fetch(`http://localhost:3001/api/concept-graph/entities/${entity.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load entity');
      }

      const data = await response.json();
      setSelectedEntity(data);
    } catch (error) {
      console.error('Failed to load entity details:', error);
      toast.error('Failed to load entity details');
    }
  };

  return (
    <MainLayout
      title="Concept Graph"
      description="AI-powered knowledge extraction and visualization"
      headerActions={
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('network')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition ${
                view === 'network'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Network Graph
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition ${
                view === 'list'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List View
            </button>
          </div>
          <button onClick={loadGraph} className="btn-secondary" disabled={loading}>
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Analyzing your knowledge with AI...</p>
            <p className="text-sm text-gray-500 mt-2">
              Extracting entities, relationships, and insights
            </p>
          </div>
        </div>
      ) : !graphData || graphData.entities.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CpuChipIcon className="w-10 h-10 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Build Your Knowledge Graph
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Add more documents to unlock AI-powered entity extraction, relationship mapping, and deep insights.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/upload" className="btn-primary">
              Upload Documents
            </Link>
            <Link href="/library" className="btn-secondary">
              Browse Library
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{graphData.stats.totalEntities}</div>
                  <div className="text-sm opacity-90">Entities Extracted</div>
                </div>
                <CpuChipIcon className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="card p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{graphData.stats.totalRelationships}</div>
                  <div className="text-sm opacity-90">Relationships</div>
                </div>
                <LinkIcon className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="card p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{graphData.stats.totalClusters}</div>
                  <div className="text-sm opacity-90">Clusters</div>
                </div>
                <ChartBarIcon className="w-12 h-12 opacity-50" />
              </div>
            </div>

            <div className="card p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    {Object.keys(graphData.stats.entityTypes).length}
                  </div>
                  <div className="text-sm opacity-90">Entity Types</div>
                </div>
                <SparklesIcon className="w-12 h-12 opacity-50" />
              </div>
            </div>
          </div>

          {/* AI Insights */}
          {graphData.insights && graphData.insights.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {graphData.insights.slice(0, 4).map((insight: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-gradient-to-br from-brand-50 to-purple-50 rounded-xl border border-brand-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{insight.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                        <p className="text-sm text-gray-700">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content */}
          {view === 'network' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Network Graph - 3/4 width */}
              <div className="lg:col-span-3">
                <div className="card p-6 h-[700px]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Concept Network</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Interactive visualization of knowledge entities and relationships
                      </p>
                    </div>
                  </div>
                  <div className="h-[600px]">
                    <NetworkGraph
                      entities={graphData.entities}
                      relationships={graphData.relationships}
                      onNodeClick={handleEntityClick}
                      selectedEntityId={selectedEntity?.entity?.id}
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar - 1/4 width */}
              <div className="space-y-6">
                <div className="card p-6">
                  <EntityExplorer
                    entities={graphData.entities}
                    selectedEntity={selectedEntity?.entity || null}
                    onEntityClick={handleEntityClick}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <EntityExplorer
                  entities={graphData.entities}
                  selectedEntity={selectedEntity?.entity || null}
                  onEntityClick={handleEntityClick}
                />
              </div>

              <div className="card p-6">
                <RelationshipExplorer
                  relationships={graphData.relationships}
                  entities={graphData.entities}
                />
              </div>
            </div>
          )}

          {/* Entity Details Modal */}
          {selectedEntity && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-purple-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedEntity.entity.name}
                        </h2>
                        <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold">
                          {selectedEntity.entity.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{selectedEntity.entity.count} mentions</span>
                        <span>•</span>
                        <span>{selectedEntity.entity.documentIds.length} documents</span>
                        <span>•</span>
                        <span>Importance: {selectedEntity.entity.importance.toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEntity(null)}
                      className="p-2 hover:bg-white/50 rounded-lg transition"
                    >
                      <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Related Entities */}
                  {selectedEntity.relatedEntities.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5" />
                        Connected Entities ({selectedEntity.relatedEntities.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedEntity.relatedEntities.slice(0, 6).map((entity: Entity) => (
                          <button
                            key={entity.id}
                            onClick={() => handleEntityClick(entity)}
                            className="p-3 bg-gray-50 hover:bg-brand-50 rounded-lg transition text-left border border-gray-200 hover:border-brand-300"
                          >
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {entity.name}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {entity.type} • {entity.count} mentions
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Relationships */}
                  {selectedEntity.relationships.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Relationships ({selectedEntity.relationships.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedEntity.relationships.slice(0, 5).map((rel: Relationship) => {
                          const otherEntityId = rel.source === selectedEntity.entity.id ? rel.target : rel.source;
                          const otherEntity = selectedEntity.relatedEntities.find(e => e.id === otherEntityId);
                          
                          return (
                            <div key={rel.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">
                                  {selectedEntity.entity.name}
                                </span>
                                <span className="text-gray-500 mx-2">
                                  {rel.type.replace(/_/g, ' ')} →
                                </span>
                                <span className="font-medium text-gray-900">
                                  {otherEntity?.name || 'Unknown'}
                                </span>
                              </div>
                              {rel.evidence.length > 0 && (
                                <div className="text-xs text-gray-600 mt-2 italic">
                                  "{rel.evidence[0].substring(0, 150)}..."
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedEntity.documents.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5" />
                        Mentioned in Documents ({selectedEntity.documents.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedEntity.documents.map((doc: any) => (
                          <Link
                            key={doc.id}
                            href={`/library/${doc.id}`}
                            className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                            onClick={() => setSelectedEntity(null)}
                          >
                            <div className="flex items-start gap-3">
                              <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 group-hover:text-brand-600 line-clamp-1">
                                  {doc.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {doc.word_count?.toLocaleString() || 0} words
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}