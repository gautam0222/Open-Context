'use client';

import { useEffect, useRef } from 'react';

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

interface KnowledgeGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
}

export default function KnowledgeGraphCanvas({
  nodes,
  edges,
  onNodeClick,
}: KnowledgeGraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let sigma: any = null;
    let graph: any = null;

    const initGraph = async () => {
      // Dynamic imports to avoid SSR issues
      const Sigma = (await import('sigma')).default;
      const Graph = (await import('graphology')).default;
      const forceAtlas2 = (await import('graphology-layout-forceatlas2')).default;

      // Create graph
      graph = new Graph();

      // Add nodes
      nodes.forEach((node, index) => {
        graph.addNode(node.id, {
          label: node.label,
          size: node.size,
          color: node.color,
          x: Math.cos((index * 2 * Math.PI) / nodes.length) * 50,
          y: Math.sin((index * 2 * Math.PI) / nodes.length) * 50,
        });
      });

      // Add edges
      edges.forEach(edge => {
        try {
          if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
            graph.addEdge(edge.source, edge.target, {
              size: edge.size,
              color: edge.color,
            });
          }
        } catch (error) {
          // Skip duplicate edges
        }
      });

      // Apply force-directed layout
      try {
        const settings = forceAtlas2.inferSettings(graph);
        forceAtlas2.assign(graph, {
          iterations: 100,
          settings: {
            ...settings,
            gravity: 1,
            scalingRatio: 10,
            barnesHutOptimize: true,
          },
        });
      } catch (error) {
        console.warn('ForceAtlas2 layout failed, using circular layout');
      }

      // Create Sigma instance
      sigma = new Sigma(graph, containerRef.current!, {
        renderEdgeLabels: false,
        enableEdgeEvents: false,
        labelRenderedSizeThreshold: 8,
        labelDensity: 0.07,
        labelGridCellSize: 60,
      });

      // Handle node clicks
      if (onNodeClick) {
        sigma.on('clickNode', ({ node }: { node: string }) => {
          onNodeClick(node);
        });
      }

      // Handle hover
      sigma.on('enterNode', ({ node }: { node: string }) => {
        if (containerRef.current) {
          containerRef.current.style.cursor = 'pointer';
        }
      });

      sigma.on('leaveNode', () => {
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
      });
    };

    initGraph();

    // Cleanup
    return () => {
      if (sigma) {
        sigma.kill();
      }
    };
  }, [nodes, edges, onNodeClick]);

  return <div ref={containerRef} className="w-full h-full bg-white rounded-lg" />;
}