'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

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

interface NetworkGraphProps {
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

const TYPE_ICONS: Record<string, string> = {
  person: '👤',
  organization: '🏢',
  technology: '💻',
  concept: '💡',
  location: '📍',
  product: '📦',
  date: '📅',
};

export default function NetworkGraph({
  entities,
  relationships,
  onNodeClick,
  selectedEntityId,
}: NetworkGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    // Limit to top 50 entities
    const topEntities = entities
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 50);

    const entityIds = new Set(topEntities.map(e => e.id));

    // Create nodes in a circular layout
    const centerX = 500;
    const centerY = 400;
    const radius = 300;

    const newNodes: Node[] = topEntities.map((entity, index) => {
      const angle = (index / topEntities.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const size = Math.sqrt(entity.importance) * 20 + 40;
      const isSelected = entity.id === selectedEntityId;

      return {
        id: entity.id,
        type: 'custom',
        position: { x, y },
        data: {
          label: entity.name,
          entity,
          size,
          color: TYPE_COLORS[entity.type] || TYPE_COLORS.concept,
          icon: TYPE_ICONS[entity.type] || '●',
          isSelected,
        },
        style: {
          width: size,
          height: size,
          background: TYPE_COLORS[entity.type] || TYPE_COLORS.concept,
          borderRadius: '50%',
          border: isSelected ? '4px solid white' : '2px solid rgba(255,255,255,0.3)',
          boxShadow: isSelected 
            ? `0 0 20px ${TYPE_COLORS[entity.type] || TYPE_COLORS.concept}` 
            : '0 4px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size / 3}px`,
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        },
      };
    });

    // Create edges
    const filteredRelationships = relationships.filter(
      rel => entityIds.has(rel.source) && entityIds.has(rel.target)
    );

    const newEdges: Edge[] = filteredRelationships.map((rel, index) => ({
      id: `edge-${index}`,
      source: rel.source,
      target: rel.target,
      animated: rel.strength > 2,
      style: {
        stroke: 'rgba(100, 116, 139, 0.3)',
        strokeWidth: Math.max(rel.strength * 0.5, 1),
      },
      type: 'smoothstep',
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [entities, relationships, selectedEntityId, setNodes, setEdges]);

  const onNodeClickHandler = useCallback((event: React.MouseEvent, node: Node) => {
    const entity = entities.find(e => e.id === node.id);
    if (entity) {
      onNodeClick(entity);
    }
  }, [entities, onNodeClick]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="#374151" gap={16} />
        <Controls className="bg-white/10 backdrop-blur-md border-white/20" />
        <MiniMap 
          className="bg-gray-800/50 backdrop-blur-md border border-white/10"
          nodeColor={(node) => node.data.color}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
        
        <Panel position="top-left" className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg m-4">
          <div className="font-semibold text-gray-900 mb-2 text-sm">Entity Types</div>
          <div className="space-y-1.5">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-gray-700 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel position="bottom-left" className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-3 text-white text-xs m-4">
          <div className="font-semibold mb-1">Controls:</div>
          <div>🖱️ <strong>Drag</strong> to pan</div>
          <div>🔍 <strong>Scroll</strong> to zoom</div>
          <div>🎯 <strong>Click node</strong> for details</div>
        </Panel>

        <Panel position="bottom-right" className="bg-white/95 backdrop-blur rounded-lg px-4 py-2 shadow-lg m-4">
          <div className="text-xs text-gray-600">
            Showing <strong className="text-gray-900">{nodes.length}</strong> entities
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}