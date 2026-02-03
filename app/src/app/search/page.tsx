export default function SearchPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-white text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🔍 Search</h1>
          <p className="opacity-90">Coming in Phase 2</p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <input
            type="text"
            placeholder="Search your knowledge graph..."
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
            disabled
          />
          
          <div className="mt-8 text-center text-gray-500">
            <p>Semantic search will be implemented in Phase 2</p>
            <p className="mt-2 text-sm">Stay tuned! 🚀</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a href="/" className="text-white hover:underline">← Back to Home</a>
        </div>
      </div>
    </main>
  )
}