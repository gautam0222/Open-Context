# 🚀 Open Context Setup Guide

Welcome! This guide will help you set up the entire Open Context project.

## Prerequisites

Make sure you have:
- **Node.js** 18+ and **npm** 9+
- **Python** 3.9+
- **Git**
- A modern browser (Chrome/Firefox)

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd open-context

# Install all dependencies (this will take a few minutes)
npm install
```

This installs dependencies for all workspaces (extension, app, server, shared).

### 2. Build Shared Package

```bash
cd shared
npm run build
cd ..
```

### 3. Set Up Python Environment

```bash
cd scripts
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 4. Set Up Environment Variables

```bash
# In the server directory
cd server
cp .env.example .env
# Edit .env if needed (defaults should work)
cd ..
```

### 5. Start Development Servers

Open 3 terminal windows:

**Terminal 1 - Extension (auto-rebuild on changes):**
```bash
npm run dev:extension
```

**Terminal 2 - Server:**
```bash
npm run dev:server
```

**Terminal 3 - Web App:**
```bash
npm run dev:app
```

Or start all at once:
```bash
npm run dev:all
```

### 6. Load Extension in Browser

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Navigate to `open-context/extension/dist`
6. Click **Select Folder**

You should see the Open Context extension loaded!

### 7. Test Everything

1. **Extension**: Right-click on any webpage → "Add to Open Context"
2. **Server**: Visit `http://localhost:3001/health` (should see status)
3. **App**: Visit `http://localhost:3000` (should see homepage)

## Verification Checklist

- [ ] Extension shows in browser toolbar
- [ ] Right-click menu shows "Add to Open Context"
- [ ] Server responds at `http://localhost:3001/health`
- [ ] Web app loads at `http://localhost:3000`
- [ ] Clicking extension icon shows popup
- [ ] No errors in any terminal

## Troubleshooting

### Extension won't load
- Make sure you ran `npm run dev:extension` first
- Check that `extension/dist` folder exists
- Look for errors in Chrome's extension page

### Server won't start
- Check if port 3001 is already in use
- Make sure `.env` file exists in `server/`
- Check for errors in terminal

### App won't start
- Check if port 3000 is already in use
- Make sure dependencies installed: `npm install`
- Try clearing Next.js cache: `rm -rf app/.next`

### Import errors
- Rebuild shared package: `cd shared && npm run build`
- Reinstall dependencies: `npm install`

## Next Steps

Now that everything is set up, you're ready for **Milestone 0.2**!

Check out `docs/development.md` for development workflow tips.

## Quick Commands Reference

```bash
# Development
npm run dev:all          # Start all services
npm run dev:extension    # Extension only
npm run dev:app          # Web app only
npm run dev:server       # Server only

# Building
npm run build:all        # Build everything for production

# Code quality
npm run lint             # Lint all code
npm run format           # Format all code with Prettier

# Individual workspace commands
npm run dev -w extension
npm run dev -w app
npm run dev -w server
```

## Project Structure

```
open-context/
├── extension/        # Browser extension
│   ├── src/         # TypeScript source
│   ├── public/      # Static assets
│   └── dist/        # Built extension (load this in Chrome)
├── app/             # Next.js web app
│   └── src/         # App source code
├── server/          # Express server
│   └── src/         # Server source code
├── scripts/         # Python NLP scripts
│   └── venv/        # Python virtual environment
└── shared/          # Shared TypeScript types
    └── src/         # Shared code
```

Happy coding! 🚀