# 🛠️ Development Workflow

Best practices for working on Open Context.

## Daily Workflow

### Morning Routine
1. Pull latest changes: `git pull`
2. Install any new dependencies: `npm install`
3. Start all services: `npm run dev:all`
4. Check all three services are running:
   - Extension rebuilding on save
   - Server at http://localhost:3001
   - App at http://localhost:3000

### Making Changes

#### Extension Changes
1. Edit files in `extension/src/`
2. Webpack auto-rebuilds
3. Go to `chrome://extensions/` and click refresh icon
4. Test your changes

#### App Changes
1. Edit files in `app/src/`
2. Next.js hot-reloads automatically
3. Changes appear instantly in browser
4. Check browser console for errors

#### Server Changes
1. Edit files in `server/src/`
2. Server auto-restarts (ts-node-dev)
3. Test endpoints with curl or browser
4. Check server terminal for errors

#### Shared Types Changes
1. Edit files in `shared/src/`
2. Rebuild: `cd shared && npm run build`
3. Other packages will pick up changes
4. May need to restart server/extension

### Testing Changes

```bash
# Test extension
1. Right-click on webpage
2. Click "Add to Open Context"
3. Check extension popup shows count

# Test server
curl http://localhost:3001/health

# Test app
Visit http://localhost:3000
```

### End of Day
1. Commit your work:
   ```bash
   git add .
   git commit -m "feat: describe what you built"
   git push
   ```
2. Update progress in README.md
3. Document any blockers or questions

## Git Workflow

### Commit Messages
Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (no logic change)
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

Examples:
```bash
git commit -m "feat: add context menu to extension"
git commit -m "fix: handle missing URLs in capture"
git commit -m "docs: update setup instructions"
```

### Branching Strategy
```bash
# Main branch for stable code
main

# Feature branches
git checkout -b feature/semantic-search
git checkout -b feature/graph-visualization

# Bug fixes
git checkout -b fix/extension-popup-error
```

## Code Quality

### Before Committing
```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix lint errors
npm run lint -- --fix
```

### TypeScript
- Always use types (no `any` unless necessary)
- Add JSDoc comments for complex functions
- Use shared types from `@open-context/shared`

### React
- Use functional components + hooks
- Keep components small and focused
- Use TypeScript interfaces for props

## Debugging

### Extension Debugging
1. Go to `chrome://extensions/`
2. Click "Inspect views: background page" (for service worker)
3. Right-click page → Inspect (for content script)
4. Check Console tab for logs

### Server Debugging
- Logs appear in server terminal
- Add `console.log()` statements
- Check request/response in Network tab

### App Debugging
- Use React DevTools extension
- Check browser console
- Use Next.js error overlay

### Common Issues

**Extension not updating:**
- Hard refresh the extension in chrome://extensions
- Check webpack is rebuilding (watch terminal)
- Clear extension storage: chrome.storage.local.clear()

**Server CORS errors:**
- Check CORS middleware in server/src/index.ts
- Make sure origins are allowed

**Type errors:**
- Rebuild shared package: `cd shared && npm run build`
- Check import paths use `@open-context/shared`

## Performance Tips

### Extension
- Minimize background script activity
- Use debouncing for frequent events
- Store data efficiently in chrome.storage

### Server
- Add caching for expensive operations
- Use async/await properly
- Monitor memory usage

### App
- Use React.memo for expensive components
- Lazy load heavy components
- Optimize images and assets

## Helpful Commands

```bash
# Clean build artifacts
rm -rf */dist */node_modules */.next

# Reinstall everything
npm install

# Check for outdated packages
npm outdated

# Update packages
npm update

# View logs
# Extension: Chrome DevTools
# Server: Terminal output
# App: Browser console + Terminal

# Kill stuck processes
# macOS/Linux: pkill -f node
# Windows: taskkill /F /IM node.exe
```

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Next.js Docs](https://nextjs.org/docs)
- [Express Docs](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

1. Check this documentation
2. Search existing issues on GitHub
3. Check browser/server console for errors
4. Ask for help in discussions
5. Create a detailed issue with:
   - What you're trying to do
   - What's happening
   - Error messages
   - Steps to reproduce

Happy developing! 🚀