export function DocumentCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 animate-pulse">
      <div className="h-10 w-16 bg-white/20 rounded mb-1" />
      <div className="h-4 w-20 bg-white/20 rounded" />
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="ml-4">
          <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}