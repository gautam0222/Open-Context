'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import KnowledgeGraphCanvas from '@/components/KnowledgeGraphCanvas';
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  size: number;
  color: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    entities: number;
    documents: number;
  };
}

interface EntityDetails {
  entity: {
    id: string;
    name: string;
    type: string;
    frequency: number;
  };
  relatedDocuments: Array<{
    id: string;
    title: string;
    relevance: number;
  }>;
  relatedEntities: Array<{
    id: string;
    name: string;
    type: string;
    strength: number;
  }>;
}

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [entityDetails, setEntityDetails] = useState<EntityDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/graph');
      const data = await response.json();
      setGraphData(data);
      toast.success(`Loaded ${data.stats.totalNodes} nodes!`);
    } catch (error) {
      console.error('Failed to load graph:', error);
      toast.error('Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = async (nodeId: string) => {
    setSelectedNode(nodeId);
    
    // Find the node
    const node = graphData?.nodes.find(n => n.id === nodeId);
    
    if (node && node.type !== 'document') {
      // Load entity details
      try {
        const response = await fetch(`http://localhost:3001/api/entities/${nodeId}`);
        const data = await response.json();
        setEntityDetails(data);
      } catch (error) {
        console.error('Failed to load entity details:', error);
      }
    } else if (node && node.type === 'document') {
      // Navigate to document
      window.open(`/library/${nodeId}`, '_blank');
    }
  };

  const filteredNodes = graphData?.nodes.filter(node => {
    const matchesSearch = !searchQuery || 
      node.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || node.type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  const filteredEdges = graphData?.edges.filter(edge => {
    const sourceNode = filteredNodes.find(n => n.id === edge.source);
    const targetNode = filteredNodes.find(n => n.id === edge.target);
    return sourceNode && targetNode;
  }) || [];

  const handleReprocess = async () => {
  if (!confirm('Re-process all documents to extract entities?\n\nThis may take a few minutes.')) {
    return;
  }

  setLoading(true);
  const reprocessPromise = fetch('http://localhost:3001/api/documents/reprocess', {
    method: 'POST',
  }).then(res => res.json());

  toast.promise(reprocessPromise, {
    loading: 'Re-processing documents...',
    success: (data) => `Processed ${data.processedDocuments} documents!`,
    error: 'Re-processing failed',
  });

  try {
    await reprocessPromise;
    // Reload graph
    await loadGraph();
  } catch (error) {
    console.error('Re-processing failed:', error);
  } finally {
    setLoading(false);
  }
};

  return (
    <MainLayout
      title="Knowledge Graph"
      description="Explore connections between concepts and documents"
      headerActions={
  <div className="flex gap-2">
    <button onClick={handleReprocess} className="btn-ghost" disabled={loading}>
      <ArrowPathIcon className="w-4 h-4" />
      Re-process All
    </button>
    <button onClick={loadGraph} className="btn-secondary" disabled={loading}>
      <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  </div>
}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-4 overflow-y-auto scrollbar-thin">
          {/* Search */}
          <div className="card p-4">
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Types</option>
              <option value="person">People</option>
              <option value="place">Places</option>
              <option value="organization">Organizations</option>
              <option value="topic">Topics</option>
              <option value="document">Documents</option>
            </select>
          </div>

          {/* Stats */}
          {graphData && (
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Graph Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Nodes</span>
                  <span className="font-semibold text-gray-900">{graphData.stats.totalNodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connections</span>
                  <span className="font-semibold text-gray-900">{graphData.stats.totalEdges}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entities</span>
                  <span className="font-semibold text-gray-900">{graphData.stats.entities}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Documents</span>
                  <span className="font-semibold text-gray-900">{graphData.stats.documents}</span>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                <span className="text-gray-700">People</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                <span className="text-gray-700">Places</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
                <span className="text-gray-700">Organizations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                <span className="text-gray-700">Topics</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#6b7280]"></div>
                <span className="text-gray-700">Documents</span>
              </div>
            </div>
          </div>

          {/* Entity Details */}
          {entityDetails && (
            <div className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{entityDetails.entity.name}</h3>
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    setEntityDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>{' '}
                  <span className="font-medium text-gray-900 capitalize">{entityDetails.entity.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Frequency:</span>{' '}
                  <span className="font-medium text-gray-900">{entityDetails.entity.frequency}</span>
                </div>

                {entityDetails.relatedDocuments.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-900 mb-2">Related Documents</div>
                    <div className="space-y-1">
                      {entityDetails.relatedDocuments.slice(0, 5).map(doc => (
                        <Link
                          key={doc.id}
                          href={`/library/${doc.id}`}
                          className="block text-brand-600 hover:text-brand-700 truncate text-sm"
                        >
                          {doc.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {entityDetails.relatedEntities.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-900 mb-2">Related Concepts</div>
                    <div className="flex flex-wrap gap-1">
                      {entityDetails.relatedEntities.slice(0, 10).map(entity => (
                        <button
                          key={entity.id}
                          onClick={() => handleNodeClick(entity.id)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition"
                        >
                          {entity.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Graph Visualization */}
        <div className="lg:col-span-3">
          <div className="card p-0 h-full overflow-hidden relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading knowledge graph...</p>
                </div>
              </div>
            ) : graphData && filteredNodes.length > 0 ? (
              <KnowledgeGraphCanvas
                nodes={filteredNodes}
                edges={filteredEdges}
                onNodeClick={handleNodeClick}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <InformationCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Graph Data</h3>
                  <p className="text-gray-600 mb-4">
                    Start capturing documents to build your knowledge graph
                  </p>
                  <Link href="/library" className="btn-primary">
                    Go to Library
                  </Link>
                </div>
              </div>
            )}

            {/* Instructions Overlay */}
            {!loading && graphData && filteredNodes.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg text-xs text-gray-600 border border-gray-200">
                <div className="font-semibold mb-1">Controls:</div>
                <div>• Click node to view details</div>
                <div>• Scroll to zoom</div>
                <div>• Drag to pan</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}