export default function GraphPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-white text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🕸️ Knowledge Graph</h1>
          <p className="opacity-90">Coming in Phase 3</p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ minHeight: '500px' }}>
          <div className="flex items-center justify-center h-full text-center text-gray-500">
            <div>
              <div className="text-6xl mb-4">🕸️</div>
              <p className="text-xl mb-2">Graph visualization coming soon</p>
              <p>Interactive knowledge graph will be implemented in Phase 3</p>
              <p className="mt-4 text-sm">
                This will show connections between concepts, documents, and entities
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a href="/" className="text-white hover:underline">← Back to Home</a>
        </div>
      </div>
    </main>
  )
}