export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-6xl font-bold mb-4">
              🧠 Open Context
            </h1>
            <p className="text-2xl opacity-90">
              Your Personal Knowledge Graph
            </p>
          </div>

          {/* Hero Section */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <h2 className="text-3xl font-semibold mb-4">
                Welcome to Open Context
              </h2>
              <p className="text-lg opacity-90 mb-6">
                Transform your browsing into a searchable, interconnected knowledge base. 
                Capture, analyze, and visualize everything you read online.
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/search"
                  className="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-opacity-90 transition"
                >
                  🔍 Search
                </a>
                <a
                  href="/documents"
                  className="px-6 py-3 bg-white/20 backdrop-blur rounded-lg font-semibold hover:bg-white/30 transition"
                >
                  📚 Documents
                </a>
                <a
                  href="/graph"
                  className="px-6 py-3 bg-white/20 backdrop-blur rounded-lg font-semibold hover:bg-white/30 transition"
                >
                  🕸️ Graph
                </a>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Semantic Search</h3>
              <p className="opacity-80">
                Find content by meaning, not just keywords. Powered by AI embeddings.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="text-4xl mb-3">🕸️</div>
              <h3 className="text-xl font-semibold mb-2">Knowledge Graph</h3>
              <p className="opacity-80">
                Visualize connections between concepts and discover new insights.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="opacity-80">
                100% local-first. Your data never leaves your device by default.
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mt-16 text-sm opacity-75">
            <p>✨ Version 0.1.0 - Development Mode</p>
            <p className="mt-2">
              Extension installed? Start capturing pages by right-clicking and selecting "Add to Open Context"
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}