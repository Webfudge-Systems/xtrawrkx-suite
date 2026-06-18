# Development Setup Guide

This guide explains how to set up and run the XtraWrkx LinkedIn Extension in development mode.

## Prerequisites

- **Chrome Browser** (version 114 or higher - required for sidePanel API)
- **Node.js** (for running build scripts, if needed)
- **Git** (if cloning from repository)

## Quick Start (Development Mode)

### Option 1: Direct Development (Recommended)

For development, you can load the extension directly from the source folder without building:

1. **Navigate to Extension Directory**

   ```bash
   cd xtrawrkx-linkedin-extension
   ```

2. **Open Chrome Extensions Page**

   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

3. **Enable Developer Mode**

   - Toggle "Developer mode" switch in the top-right corner

4. **Load the Extension**

   - Click "Load unpacked" button
   - Select the `xtrawrkx-linkedin-extension` folder (the root folder containing `manifest.json`)
   - The extension should now appear in your extensions list

5. **Pin the Extension** (Optional but recommended)

   - Click the puzzle piece icon (🧩) in Chrome toolbar
   - Find "Xtrawrkx LinkedIn Extension"
   - Click the pin icon to keep it visible

6. **Configure for Development**
   - Right-click the extension icon → "Options"
   - Or click the extension icon and select "Options"
   - Enter your development API URL (e.g., `http://localhost:1337` or your dev server URL)
   - Sign in with your credentials

### Option 2: Build Then Load

If you prefer to use the build process:

1. **Install Dependencies** (if not already installed)

   ```bash
   cd xtrawrkx-linkedin-extension
   npm install
   ```

2. **Build the Extension**

   ```bash
   npm run build
   ```

   This copies files to the `dist/` folder.

3. **Load from Dist Folder**
   - Follow steps 2-6 from Option 1 above
   - But select the `dist/` folder instead of the root folder

## Development Workflow

### Making Changes

1. **Edit Source Files**

   - All source files are in the `src/` directory
   - Make your changes directly in the source files

2. **Reload Extension**

   - Go to `chrome://extensions/`
   - Find "Xtrawrkx LinkedIn Extension"
   - Click the refresh/reload icon (🔄) next to the extension
   - Or: Right-click extension icon → "Reload"

3. **Test Changes**
   - Navigate to a LinkedIn page (e.g., `linkedin.com/in/someone`)
   - Open the extension sidebar (click extension icon)
   - Test your changes

### Hot Reloading

Chrome extensions don't support true hot reloading, but you can:

- **Auto-reload on file changes**: Use a file watcher tool like `nodemon` or `chokidar-cli`
- **Manual reload**: Use the refresh button in `chrome://extensions/`

Example with nodemon:

```bash
npm install -g nodemon
nodemon --watch src --exec "echo 'Files changed - reload extension manually'"
```

## Testing

### Testing on LinkedIn

1. **Navigate to LinkedIn**

   - Go to `https://www.linkedin.com`
   - Log in to your LinkedIn account

2. **Test Profile Import**

   - Visit any LinkedIn profile (e.g., `linkedin.com/in/username`)
   - Click the extension icon to open sidebar
   - Test importing the profile

3. **Test Company Import**
   - Visit any LinkedIn company page (e.g., `linkedin.com/company/company-name`)
   - Test importing the company

### Debugging

1. **View Console Logs**

   - **Background Service Worker**:

     - Go to `chrome://extensions/`
     - Find your extension
     - Click "service worker" link (or "Inspect views: service worker")
     - Console logs will appear here

   - **Content Script**:

     - Right-click on LinkedIn page → "Inspect"
     - Go to "Console" tab
     - Content script logs appear here

   - **Sidebar/Popup**:
     - Right-click inside sidebar/popup → "Inspect"
     - Go to "Console" tab

2. **Debug Service Worker**

   ```javascript
   // In service-worker.js or api-client.js
   console.log("Debug message", data);
   ```

3. **Check Storage**
   - Open DevTools → Application tab
   - Check "Storage" → "Chrome Extension" for stored data
   - Or use Chrome Storage API in console:
     ```javascript
     chrome.storage.sync.get(null, console.log);
     chrome.storage.local.get(null, console.log);
     ```

## Common Development Tasks

### Change API URL for Development

Edit `src/utils/api-client.js`:

```javascript
// In init() method, change:
this.baseURL = "https://xtrawrkxsuits-production.up.railway.app";
// To:
this.baseURL = "http://localhost:1337"; // or your dev URL
```

Or configure it in the Options page (recommended).

### Test Authentication

1. Open extension Options page
2. Enter test credentials
3. Check browser console for authentication logs
4. Verify token is stored in `chrome.storage.sync`

### Test API Calls

1. Open service worker console (`chrome://extensions/` → "service worker")
2. Make API calls through the extension
3. Check network requests in service worker console
4. Verify responses and error handling

## File Structure

```
xtrawrkx-linkedin-extension/
├── manifest.json              # Extension configuration
├── src/
│   ├── background/
│   │   └── service-worker.js  # Background service (API calls, message handling)
│   ├── content/
│   │   ├── linkedin-extractor.js  # Extracts data from LinkedIn pages
│   │   └── styles.css
│   ├── sidebar/
│   │   ├── sidebar.html       # Sidebar UI
│   │   ├── sidebar.js         # Sidebar logic
│   │   └── sidebar.css
│   ├── options/
│   │   ├── options.html       # Options/settings page
│   │   ├── options.js
│   │   └── options.css
│   ├── popup/
│   │   ├── popup.html         # Popup UI (if used)
│   │   ├── popup.js
│   │   └── popup.css
│   └── utils/
│       ├── api-client.js      # API communication
│       ├── data-mapper.js     # Data transformation
│       ├── error-handler.js   # Error handling
│       ├── logger.js          # Logging utility
│       └── config.js          # Configuration
├── icons/                     # Extension icons
├── dist/                      # Built files (after npm run build)
└── scripts/
    ├── build.js               # Build script
    └── package.js             # Package script
```

## Troubleshooting

### Extension Not Loading

- **Check manifest.json**: Ensure it's valid JSON
- **Check file paths**: All paths in manifest must be correct
- **Check Chrome version**: Must be 114+ for sidePanel API
- **Check console**: Look for errors in `chrome://extensions/`

### Changes Not Appearing

- **Reload extension**: Click refresh in `chrome://extensions/`
- **Clear cache**: Right-click extension → "Reload"
- **Hard refresh**: Close and reopen Chrome

### Service Worker Not Running

- **Check service worker status**: `chrome://extensions/` → "service worker" link
- **Check for errors**: Open service worker console
- **Restart service worker**: Click "service worker" link and check console

### API Calls Failing

- **Check API URL**: Verify in Options page or api-client.js
- **Check CORS**: Ensure backend allows extension origin
- **Check authentication**: Verify token is stored and valid
- **Check network**: Open service worker console to see network errors

### Sidebar Not Opening

- **Check Chrome version**: Must be 114+ for sidePanel API
- **Check permissions**: Ensure sidePanel permission is in manifest
- **Check LinkedIn page**: Extension only works on LinkedIn
- **Check console**: Look for errors in service worker console

## Production Build

When ready for production:

```bash
npm run build    # Build to dist/
npm run package  # Build and create zip file
```

The zip file can be submitted to Chrome Web Store.

## Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extension API Reference](https://developer.chrome.com/docs/extensions/reference/)

## Notes

- The extension uses Manifest V3
- Requires Chrome 114+ for sidePanel API
- Development mode doesn't require building - load directly from source
- Always test on actual LinkedIn pages, not localhost
- Service worker logs are separate from page console logs





