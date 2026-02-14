'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

function CustomNode({ data, selected }: NodeProps) {
  return (
    <div
      className="relative group"
      style={{
        width: data.size,
        height: data.size,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 hover:scale-110"
        style={{
          background: data.color,
          border: selected || data.isSelected ? `4px solid white` : `2px solid rgba(255,255,255,0.3)`,
          boxShadow: selected || data.isSelected 
            ? `0 0 30px ${data.color}` 
            : '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <span style={{ fontSize: `${data.size / 2.5}px` }}>{data.icon}</span>
      </div>

      {/* Label on hover */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        <div className="font-semibold text-gray-900 text-sm">{data.label}</div>
        <div className="text-xs text-gray-600 mt-1">
          {data.entity.count} mentions • {data.entity.importance.toFixed(1)} importance
        </div>
      </div>
    </div>
  );
}

export default memo(CustomNode);