'use client';

interface TimelineData {
  month: string;
  topics: number;
  topicNames: string[];
}

interface KnowledgeTimelineProps {
  timeline: TimelineData[];
}

export default function KnowledgeTimeline({ timeline }: KnowledgeTimelineProps) {
  const maxTopics = Math.max(...timeline.map(t => t.topics), 1);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Learning Timeline</h3>
      
      {timeline.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No timeline data yet
        </div>
      ) : (
        <div className="space-y-3">
          {timeline.map((item, index) => (
            <div key={index} className="group">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-sm font-medium text-gray-700 w-24">
                  {formatMonth(item.month)}
                </div>
                <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500 flex items-center px-3"
                    style={{ width: `${(item.topics / maxTopics) * 100}%` }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {item.topics} {item.topics === 1 ? 'topic' : 'topics'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expandable topic names */}
              <div className="ml-28 pl-4 border-l-2 border-gray-200 group-hover:border-brand-400 transition">
                <div className="text-xs text-gray-600">
                  {item.topicNames.join(' • ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}