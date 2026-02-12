'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const ForceGraph3DComponent = dynamic(
  () => import('react-force-graph-3d'),
  { ssr: false }
);

interface Entity {
  id: string;
  name: string;
  documentIds: string[];
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

interface ForceGraph3DProps {
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

export default function ForceGraph3D({
  entities,
  relationships,
  onNodeClick,
  selectedEntityId,
}: ForceGraph3DProps) {
  const [graphData, setGraphData] = useState<any>(null);
  const fgRef = useRef<any>();

  useEffect(() => {
    // Transform data for force graph
    const nodes = entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      count: entity.count,
      importance: entity.importance,
      val: Math.sqrt(entity.importance) * 5 + 5, // Node size
      color: TYPE_COLORS[entity.type] || TYPE_COLORS.concept,
    }));

    const links = relationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      type: rel.type,
      strength: rel.strength,
      color: `rgba(150, 150, 150, ${Math.min(rel.strength / 5, 1)})`,
    }));

    setGraphData({ nodes, links });
  }, [entities, relationships]);

  useEffect(() => {
    if (fgRef.current && selectedEntityId) {
      const node = graphData?.nodes.find((n: any) => n.id === selectedEntityId);
      if (node) {
        // Zoom to selected node
        fgRef.current.cameraPosition(
          { x: node.x, y: node.y, z: node.z + 200 },
          node,
          1000
        );
      }
    }
  }, [selectedEntityId, graphData]);

  if (!graphData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading 3D graph...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden">
      <ForceGraph3DComponent
        ref={fgRef}
        graphData={graphData}
        nodeLabel={(node: any) => `
          <div style="
            background: white;
            padding: 8px 12px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-family: Inter, sans-serif;
          ">
            <div style="font-weight: bold; color: #111; margin-bottom: 4px;">
              ${node.name}
            </div>
            <div style="font-size: 12px; color: #666;">
              ${node.type} • ${node.count} mentions
            </div>
            <div style="font-size: 11px; color: #999; margin-top: 4px;">
              Importance: ${node.importance.toFixed(2)}
            </div>
          </div>
        `}
        nodeAutoColorBy="type"
        nodeVal="val"
        linkWidth={(link: any) => link.strength}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={(link: any) => link.strength * 2}
        onNodeClick={(node: any) => {
          const entity = entities.find(e => e.id === node.id);
          if (entity) onNodeClick(entity);
        }}
        backgroundColor="rgba(17, 24, 39, 1)"
        nodeThreeObject={(node: any) => {
          if (node.id === selectedEntityId) {
            // Highlight selected node
            const sprite = new (window as any).THREE.Sprite(
              new (window as any).THREE.SpriteMaterial({
                map: new (window as any).THREE.CanvasTexture(
                  generateNodeCanvas(node.name, node.val, true)
                ),
              })
            );
            sprite.scale.set(node.val * 3, node.val * 3, 1);
            return sprite;
          }
          return undefined;
        }}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
      />
    </div>
  );
}

function generateNodeCanvas(text: string, size: number, highlighted: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = 256;
  canvas.height = 256;

  // Draw circle
  ctx.beginPath();
  ctx.arc(128, 128, 100, 0, 2 * Math.PI);
  ctx.fillStyle = highlighted ? '#6366f1' : '#ffffff';
  ctx.fill();
  
  if (highlighted) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.stroke();
  }

  // Draw text
  ctx.fillStyle = highlighted ? '#ffffff' : '#111111';
  ctx.font = 'bold 32px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.substring(0, 10), 128, 128);

  return canvas;
}