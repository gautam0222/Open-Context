export default function DocumentsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-white text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">📚 Documents</h1>
          <p className="opacity-90">Coming in Phase 2</p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-xl mb-2">No documents yet</p>
            <p>Start capturing pages using the browser extension!</p>
            <p className="mt-4 text-sm">Document management will be fully implemented in Phase 2</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a href="/" className="text-white hover:underline">← Back to Home</a>
        </div>
      </div>
    </main>
  )
}