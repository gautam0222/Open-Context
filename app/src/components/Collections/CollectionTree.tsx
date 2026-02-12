'use client';

import { useState } from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface CollectionNode {
  id: string;
  name: string;
  icon: string;
  color: string;
  children: CollectionNode[];
  stats: {
    documentCount: number;
    totalWords: number;
  };
}

interface CollectionTreeProps {
  collections: CollectionNode[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onCreateChild?: (parentId: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function CollectionTree({
  collections,
  selectedId,
  onSelect,
  onCreateChild,
  onEdit,
  onDelete,
}: CollectionTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderNode = (node: CollectionNode, level: number = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
            isSelected
              ? 'bg-brand-50 text-brand-700'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
          onClick={() => onSelect?.(node.id)}
        >
          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Icon */}
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-sm flex-shrink-0"
            style={{ backgroundColor: node.color + '20' }}
          >
            <span>{node.icon}</span>
          </div>

          {/* Name */}
          <span className="flex-1 font-medium text-sm truncate">{node.name}</span>

          {/* Count */}
          {/* Count Badge - Make it prominent */}
<span
  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
    isSelected
      ? 'bg-brand-200 text-brand-800'
      : 'bg-gray-200 text-gray-700'
  }`}
>
  {node.stats.documentCount}
</span>


          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateChild?.(node.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Add subcollection"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(node.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {collections.map(collection => renderNode(collection))}
    </div>
  );
}