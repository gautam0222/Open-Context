'use client';

interface CategoryChartProps {
  distribution: Record<string, number>;
}

export default function CategoryChart({ distribution }: CategoryChartProps) {
  const CATEGORY_COLORS: Record<string, string> = {
    'Technology': '#3b82f6',
    'Science': '#10b981',
    'Business': '#8b5cf6',
    'Personal': '#f59e0b',
    'Creative': '#ec4899',
    'Education': '#06b6d4',
    'General': '#6b7280',
  };

  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [_, count]) => sum + count, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Knowledge Areas</h3>

      {/* Pie Chart (Simplified) */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-48 h-48 rounded-full relative" style={{
          background: `conic-gradient(${entries.map(([cat, count], idx) => {
            const prevPercentage = entries.slice(0, idx).reduce((sum, [_, c]) => sum + c, 0) / total * 100;
            const percentage = count / total * 100;
            return `${CATEGORY_COLORS[cat] || CATEGORY_COLORS.General} ${prevPercentage}% ${prevPercentage + percentage}%`;
          }).join(', ')})`
        }}>
          <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-600">Topics</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {entries.map(([category, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          return (
            <div key={category} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: CATEGORY_COLORS[category] || CATEGORY_COLORS.General }}
              />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{category}</span>
                <span className="text-sm text-gray-600">
                  {count} ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}