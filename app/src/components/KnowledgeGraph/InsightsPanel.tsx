'use client';

interface Insight {
  type: string;
  title: string;
  description: string;
  icon: string;
  data?: any;
}

interface InsightsPanelProps {
  insights: Insight[];
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>

      {insights.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Not enough data for insights yet
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="p-4 bg-gradient-to-br from-brand-50 to-purple-50 rounded-xl border border-brand-200 hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{insight.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-700">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}