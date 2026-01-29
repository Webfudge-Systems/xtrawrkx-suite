# Environment Configuration Guide

This guide explains how to configure the extension for different environments (Development and Production).

## Overview

The extension now supports automatic environment detection and manual URL configuration. You can:

1. **Use Environment Presets**: Switch between Development and Production environments
2. **Custom API URL**: Override the default URL with a custom endpoint
3. **Automatic Detection**: Extension auto-detects environment based on manifest version

## Configuration Methods

### Method 1: Options Page (Recommended)

1. **Open Extension Options**
   - Right-click extension icon → "Options"
   - Or: `chrome://extensions/` → Find extension → "Options"

2. **Configure Environment**
   - Select "Development" or "Production" from the dropdown
   - Development defaults to: `http://localhost:1337`
   - Production defaults to: `https://xtrawrkxsuits-production.up.railway.app`

3. **Set Custom API URL (Optional)**
   - Enter a custom API URL in the "API Base URL" field
   - Leave empty to use environment defaults
   - Click "Save Configuration"

4. **Test Connection**
   - Click "Test Connection" to verify the API is reachable
   - Connection status will update automatically

### Method 2: Programmatic Configuration

You can also set the configuration programmatically:

```javascript
// Set environment
const config = getConfig();
await config.setEnvironment('development'); // or 'production'

// Set custom API URL
await config.setApiUrl('http://localhost:1337');

// Or set both at once
await config.setApiUrl('http://localhost:1337', 'development');
```

### Method 3: Chrome Storage (Advanced)

Directly modify Chrome storage:

```javascript
// Set environment and URL
await chrome.storage.sync.set({
    environment: 'development',
    apiBaseUrl: 'http://localhost:1337'
});
```

## Environment Detection

The extension automatically detects the environment based on:

1. **Stored Configuration**: If `environment` is set in storage, use that
2. **Manifest Version**: If version contains "dev" or "beta", use development
3. **Default**: Falls back to production

## Default URLs

| Environment | Default URL |
|------------|-------------|
| Development | `http://localhost:1337` |
| Production | `https://xtrawrkxsuits-production.up.railway.app` |

## URL Validation

The extension validates API URLs to ensure security:

- **Development**: Allows `http://` and `localhost`/`127.0.0.1`
- **Production**: Requires `https://` and only allows whitelisted domains
- **Custom URLs**: Must match allowed domains or be localhost (in dev mode)

### Allowed Domains

- `xtrawrkxsuits-production.up.railway.app`
- `xtrawrkx.com`
- `localhost` (development only)
- `127.0.0.1` (development only)

## Usage Examples

### Development Setup

```javascript
// In Options page or via code:
// 1. Select "Development" environment
// 2. API URL auto-fills to: http://localhost:1337
// 3. Save configuration
```

### Production Setup

```javascript
// In Options page or via code:
// 1. Select "Production" environment
// 2. API URL auto-fills to: https://xtrawrkxsuits-production.up.railway.app
// 3. Save configuration
```

### Custom Staging Server

```javascript
// In Options page:
// 1. Select "Production" environment (for HTTPS requirement)
// 2. Enter custom URL: https://staging.xtrawrkx.com
// 3. Save configuration
```

## How It Works

1. **API Client Initialization**
   - `api-client.js` calls `config.getApiUrl()` on init
   - Config checks storage for `apiBaseUrl` or `environment`
   - Returns appropriate URL based on configuration

2. **Storage Structure**
   ```javascript
   {
     environment: 'development' | 'production',
     apiBaseUrl: 'http://localhost:1337' // optional, overrides environment default
   }
   ```

3. **Priority Order**
   - Custom `apiBaseUrl` (if set)
   - Environment default (if `environment` is set)
   - Auto-detection based on manifest
   - Production fallback

## Troubleshooting

### URL Not Updating

- **Reload Extension**: Go to `chrome://extensions/` → Reload extension
- **Check Storage**: Verify configuration in Chrome DevTools → Application → Storage
- **Clear Storage**: If needed, clear and reconfigure

### Connection Test Fails

- **Check URL Format**: Ensure URL includes protocol (`http://` or `https://`)
- **Check CORS**: Backend must allow extension origin
- **Check Network**: Verify server is running and accessible
- **Check Firewall**: Ensure localhost is accessible (for dev)

### Environment Not Switching

- **Clear Storage**: Remove old configuration
- **Reinitialize**: Reload extension after changing config
- **Check Console**: Look for errors in service worker console

## Development Workflow

1. **Start Development**
   - Open Options page
   - Select "Development"
   - Save configuration
   - Test connection

2. **Switch to Production**
   - Open Options page
   - Select "Production"
   - Save configuration
   - Test connection

3. **Use Custom URL**
   - Enter custom URL
   - Save configuration
   - Test connection

## Code Locations

- **Config Manager**: `src/utils/config.js`
- **API Client**: `src/utils/api-client.js`
- **Options Page**: `src/options/options.js` & `options.html`
- **Service Worker**: `src/background/service-worker.js`

## Notes

- Configuration is stored in `chrome.storage.sync` (syncs across devices)
- Changes take effect immediately after saving
- API client reinitializes with new URL on config change
- Environment detection is automatic but can be overridden






