'use client';

interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  evidence: string[];
}

interface Entity {
  id: string;
  name: string;
}

interface RelationshipExplorerProps {
  relationships: Relationship[];
  entities: Entity[];
}

const RELATIONSHIP_ICONS: Record<string, string> = {
  mentions: '💬',
  influences: '⚡',
  part_of: '📦',
  similar_to: '🔄',
  contradicts: '⚔️',
  builds_on: '🏗️',
};

export default function RelationshipExplorer({
  relationships,
  entities,
}: RelationshipExplorerProps) {
  const topRelationships = relationships
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 10);

  const getEntityName = (entityId: string) => {
    return entities.find(e => e.id === entityId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Key Relationships ({relationships.length} total)
      </h3>

      <div className="space-y-2">
        {topRelationships.map((rel, index) => (
          <div
            key={rel.id}
            className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{RELATIONSHIP_ICONS[rel.type] || '🔗'}</span>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-semibold text-gray-900">
                    {getEntityName(rel.source)}
                  </span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="font-semibold text-gray-900">
                    {getEntityName(rel.target)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {rel.type.replace(/_/g, ' ')} • Strength: {rel.strength}
                </div>
              </div>
            </div>

            {rel.evidence.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 italic">
                "{rel.evidence[0].substring(0, 100)}..."
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}