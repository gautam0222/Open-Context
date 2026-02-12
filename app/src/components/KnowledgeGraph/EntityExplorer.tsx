'use client';

interface Entity {
  id: string;
  name: string;
  type: string;
  count: number;
  importance: number;
  documentIds: string[];
}

interface EntityExplorerProps {
  entities: Entity[];
  selectedEntity: Entity | null;
  onEntityClick: (entity: Entity) => void;
}

const TYPE_COLORS: Record<string, string> = {
  person: 'bg-pink-100 text-pink-700 border-pink-300',
  organization: 'bg-purple-100 text-purple-700 border-purple-300',
  technology: 'bg-blue-100 text-blue-700 border-blue-300',
  concept: 'bg-green-100 text-green-700 border-green-300',
  location: 'bg-amber-100 text-amber-700 border-amber-300',
  product: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  date: 'bg-gray-100 text-gray-700 border-gray-300',
};

export default function EntityExplorer({
  entities,
  selectedEntity,
  onEntityClick,
}: EntityExplorerProps) {
  const topEntities = entities.slice(0, 20);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Top Entities ({entities.length} total)
      </h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {topEntities.map((entity, index) => (
          <button
            key={entity.id}
            onClick={() => onEntityClick(entity)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              selectedEntity?.id === entity.id
                ? 'bg-brand-50 border-brand-400 shadow-md'
                : 'bg-white border-gray-200 hover:border-brand-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  #{index + 1} {entity.name}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs font-semibold text-gray-500">
                  {entity.importance.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLORS[entity.type] || TYPE_COLORS.concept}`}>
                {entity.type}
              </span>
              <span className="text-xs text-gray-500">
                {entity.count} mentions
              </span>
              <span className="text-xs text-gray-500">
                • {entity.documentIds.length} docs
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}