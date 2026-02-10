'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import KnowledgeGraphCanvas from '@/components/KnowledgeGraphCanvas';
import { ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  url?: string;
  wordCount?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  size: number;
  color: string;
  similarity?: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    documents: number;
  };
}

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/graph');
      const data = await response.json();
      setGraphData(data);
      
      if (data.stats.totalNodes > 0) {
        toast.success(`Loaded ${data.stats.totalNodes} documents!`);
      }
    } catch (error) {
      console.error('Failed to load graph:', error);
      toast.error('Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    window.open(`/library/${nodeId}`, '_blank');
  };

  return (
    <MainLayout
      title="Knowledge Graph"
      description="Explore connections between your documents"
      headerActions={
        <button onClick={loadGraph} className="btn-secondary" disabled={loading}>
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      }
    >
      <div className="h-[calc(100vh-12rem)]">
        {loading ? (
          <div className="card h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading knowledge graph...</p>
            </div>
          </div>
        ) : graphData && graphData.nodes.length > 0 ? (
          <div className="card p-0 h-full overflow-hidden relative">
            <KnowledgeGraphCanvas
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodeClick={handleNodeClick}
            />

            {/* Stats Overlay */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg p-4 shadow-lg border border-gray-200">
              <div className="text-sm font-semibold text-gray-900 mb-2">Graph Stats</div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>{graphData.stats.totalNodes} documents</div>
                <div>{graphData.stats.totalEdges} connections</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg text-xs text-gray-600 border border-gray-200">
              <div className="font-semibold mb-1">Controls:</div>
              <div>• Click document to open</div>
              <div>• Scroll to zoom</div>
              <div>• Drag to pan</div>
              <div>• Drag nodes to rearrange</div>
            </div>

            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg p-4 shadow-lg border border-gray-200">
              <div className="text-sm font-semibold text-gray-900 mb-2">Legend</div>
              <div className="text-xs text-gray-600">
                Lines show similarity between documents based on content
              </div>
            </div>
          </div>
        ) : (
          <div className="card h-full flex items-center justify-center">
            <div className="text-center p-8">
              <InformationCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Yet</h3>
              <p className="text-gray-600 mb-6">
                Capture some documents to see connections between them
              </p>
              <Link href="/library" className="btn-primary">
                Go to Library
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}