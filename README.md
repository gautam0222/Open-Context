# 🧠 Open Context

**Personal Knowledge Graph powered by AI**

Transform your browsing into a searchable, interconnected knowledge base. Open Context captures, analyzes, and visualizes everything you read online.

## 🌟 Features

- 🔍 **Semantic Search**: Find content by meaning, not just keywords
- 🕸️ **Knowledge Graph**: Visualize connections between concepts
- 🤖 **AI-Powered Q&A**: Ask questions about your saved content
- 🔒 **Privacy-First**: 100% local-first, your data never leaves your device (cloud sync optional)
- 🎨 **Beautiful UI**: Modern, intuitive interface built with React + TailwindCSS

## 📦 Project Structure

```
open-context/
├── extension/       # Browser extension (Manifest V3)
├── app/            # Web app (Next.js + React)
├── server/         # Local Node.js server
├── scripts/        # Python NLP/ML scripts
└── shared/         # Shared TypeScript types and utilities
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Python 3.9+ (for NLP features)
- Chrome/Firefox browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd open-context
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start all services**
   ```bash
   npm run dev:all
   ```

   Or start individually:
   ```bash
   npm run dev:extension  # Extension dev server
   npm run dev:app        # Web app (http://localhost:3000)
   npm run dev:server     # Backend server (http://localhost:3001)
   ```

### Load Extension in Browser

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder

## 🛠️ Development

- **Format code**: `npm run format`
- **Lint code**: `npm run lint`
- **Build all**: `npm run build:all`

## 📝 Roadmap

- [x] Phase 0: Foundation Setup
- [ ] Phase 1: Data Pipeline
- [ ] Phase 2: Web App Interface
- [ ] Phase 3: Knowledge Graph
- [ ] Phase 4: Advanced Features
- [ ] Phase 5: AI Integration
- [ ] Phase 6: Premium Features
- [ ] Phase 7: Launch

## 🤝 Contributing

This is an open-source project! Contributions are welcome.

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- [Documentation](./docs)
- [Issue Tracker](https://github.com/gautam0222/open-context/issues)
- [Discussions](https://github.com/gautam0222/open-context/discussions)

---

Built with ❤️ by Gautam Sukhani