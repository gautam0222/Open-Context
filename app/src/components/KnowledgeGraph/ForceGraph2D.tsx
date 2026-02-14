'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2DComponent = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
);

interface Entity {
  id: string;
  documentIds: string[];
  name: string;
  type: string;
  count: number;
  importance: number;
}

interface Relationship {
  source: string;
  target: string;
  type: string;
  strength: number;
}

interface ForceGraph2DProps {
  entities: Entity[];
  relationships: Relationship[];
  onNodeClick: (entity: Entity) => void;
  selectedEntityId?: string;
}

const TYPE_COLORS: Record<string, string> = {
  person: '#ec4899',
  organization: '#8b5cf6',
  technology: '#3b82f6',
  concept: '#10b981',
  location: '#f59e0b',
  product: '#06b6d4',
  date: '#6b7280',
};

export default function ForceGraph2D({
  entities,
  relationships,
  onNodeClick,
  selectedEntityId,
}: ForceGraph2DProps) {
  const [graphData, setGraphData] = useState<any>(null);
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  useEffect(() => {
    const updateDimensions = () => {
      const container = fgRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Only show top entities to reduce clutter
    const topEntities = entities
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 50); // Limit to top 50

    const entityIds = new Set(topEntities.map(e => e.id));

    const nodes = topEntities.map(entity => ({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      count: entity.count,
      importance: entity.importance,
      val: Math.sqrt(entity.importance) * 8 + 8,
      color: TYPE_COLORS[entity.type] || TYPE_COLORS.concept,
    }));

    // Filter relationships to only include top entities
    const filteredRelationships = relationships.filter(
      rel => entityIds.has(rel.source) && entityIds.has(rel.target)
    );

    const links = filteredRelationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      type: rel.type,
      strength: rel.strength,
    }));

    setGraphData({ nodes, links });
  }, [entities, relationships]);

  if (!graphData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
          <div>Building graph...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden relative">
      <ForceGraph2DComponent
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeAutoColorBy="type"
        nodeVal="val"
        nodeRelSize={6}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();

          // Highlight if selected
          if (node.id === selectedEntityId) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4 / globalScale;
            ctx.stroke();
            
            // Add glow effect
            ctx.shadowBlur = 20 / globalScale;
            ctx.shadowColor = node.color;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Only show label if zoomed in enough OR if hovered/selected
          const showLabel = globalScale > 1.5 || hoveredNode?.id === node.id || node.id === selectedEntityId;

          if (showLabel) {
            const label = node.name;
            const fontSize = Math.max(10, 14 / globalScale);
            ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
            
            const textWidth = ctx.measureText(label).width;
            const padding = 6 / globalScale;

            // Draw label background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(
              node.x - textWidth / 2 - padding,
              node.y + node.val + 4 / globalScale,
              textWidth + padding * 2,
              fontSize + padding * 2
            );

            // Draw label text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#fff';
            ctx.fillText(label, node.x, node.y + node.val + 4 / globalScale + padding);
          }
        }}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val * 1.5, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        linkWidth={(link: any) => Math.max(link.strength * 0.5, 0.5)}
        linkColor={() => 'rgba(100, 116, 139, 0.2)'}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={(link: any) => Math.max(link.strength * 0.3, 0.3)}
        linkDirectionalParticleSpeed={0.002}
        onNodeClick={(node: any) => {
          const entity = entities.find(e => e.id === node.id);
          if (entity) {
            onNodeClick(entity);
            
            // Zoom to node
            if (fgRef.current) {
              fgRef.current.centerAt(node.x, node.y, 1000);
              fgRef.current.zoom(4, 1000);
            }
          }
        }}
        onNodeHover={(node: any) => {
          setHoveredNode(node);
          if (fgRef.current) {
            fgRef.current.canvas().style.cursor = node ? 'pointer' : 'default';
          }
        }}
        onBackgroundClick={() => {
          if (fgRef.current) {
            fgRef.current.zoomToFit(1000, 100);
          }
        }}
        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        warmupTicks={100}
        cooldownTicks={0}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />

      {/* Hover Tooltip */}
      {hoveredNode && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-2xl border border-gray-200 max-w-xs pointer-events-none">
          <div className="font-bold text-gray-900 text-lg mb-2">{hoveredNode.name}</div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: hoveredNode.color }}
              ></span>
              <span className="text-gray-600 capitalize">{hoveredNode.type}</span>
            </div>
            <div className="text-gray-600">
              <strong>{hoveredNode.count}</strong> mentions
            </div>
            <div className="text-gray-600">
              Importance: <strong>{hoveredNode.importance.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Controls Info */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md rounded-lg px-4 py-3 text-white text-xs space-y-1">
        <div className="font-semibold mb-1">Controls:</div>
        <div>🖱️ <strong>Click & Drag</strong> nodes</div>
        <div>🔍 <strong>Scroll</strong> to zoom</div>
        <div>👆 <strong>Click background</strong> to reset view</div>
        <div>🎯 <strong>Click node</strong> for details</div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
        <div className="font-semibold text-gray-900 mb-2 text-sm">Entity Types</div>
        <div className="space-y-2">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-gray-700 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-lg px-4 py-2 shadow-lg">
        <div className="text-xs text-gray-600">
          Showing <strong className="text-gray-900">{graphData.nodes.length}</strong> entities
        </div>
      </div>
    </div>
  );
}