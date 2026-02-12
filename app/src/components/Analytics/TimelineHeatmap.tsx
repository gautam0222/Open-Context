interface HeatmapDay {
  date: string;
  count: number;
}

export default function TimelineHeatmap({
  data,
}: {
  data: HeatmapDay[];
}) {
  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count < 2) return 'bg-green-200';
    if (count < 4) return 'bg-green-400';
    return 'bg-green-600';
  };

  return (
    <div className="grid grid-cols-14 gap-1 mb-6">
      {data.map((day) => (
        <div
          key={day.date}
          className={`w-4 h-4 rounded-sm ${getIntensity(day.count)}`}
          title={`${day.date} - ${day.count} captures`}
        />
      ))}
    </div>
  );
}