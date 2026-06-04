# Authentication Loop Fix

## Problem

The extension was repeatedly asking for login credentials even after successful authentication, creating a login loop.

## Root Causes Identified

1. **Aggressive Token Clearing**: The `verifyAuth()` function was clearing the token immediately if JWT decoding failed, even if the token might still be valid
2. **Error Handling**: Decoding errors were treated as invalid tokens, causing premature logout
3. **Message Handling**: "Unknown message type" errors were causing communication issues
4. **Race Conditions**: Token could be cleared before it was properly validated

## Fixes Applied

### 1. Less Aggressive Token Validation (`api-client.js`)

**Before:**

```javascript
catch (error) {
    // If we can't decode the token, it's invalid
    await this.clearAuth();
    return false;
}
```

**After:**

```javascript
catch (error) {
    // If we can't decode the token, don't clear it immediately
    // The token might still be valid, just with a different format
    // Let the server validate it on the next API call
    if (this.logger) {
        this.logger.warn('Could not decode token for expiration check, will validate on next API call:', error.message);
    }
    // Don't clear auth here - let server-side validation handle it
    // Return true to allow the token to be used, server will reject if invalid
    return true;
}
```

**Why**: Prevents clearing valid tokens that just have decoding issues. Server-side validation on actual API calls will catch truly invalid tokens.

### 2. Improved Error Handling in Sidebar (`sidebar.js`)

**Before:**

```javascript
async checkAuthStatus() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'VERIFY_AUTH'
        });
        this.isAuthenticated = response?.authenticated || false;
        return this.isAuthenticated;
    } catch (error) {
        console.error('Auth check failed:', error);
        this.isAuthenticated = false;
        return false;
    }
}
```

**After:**

```javascript
async checkAuthStatus() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'VERIFY_AUTH'
        });

        if (!response) {
            console.warn('No response from VERIFY_AUTH');
            this.isAuthenticated = false;
            return false;
        }

        this.isAuthenticated = response.authenticated === true;

        if (this.logger) {
            this.logger.log('Auth status check:', this.isAuthenticated ? 'Authenticated' : 'Not authenticated');
        }

        return this.isAuthenticated;
    } catch (error) {
        console.error('Auth check failed:', error);
        // Don't immediately set to false on error - might be a temporary issue
        // Only set to false if we're sure there's no token
        const stored = await chrome.storage.sync.get(['authToken']);
        this.isAuthenticated = !!stored.authToken;
        return this.isAuthenticated;
    }
}
```

**Why**: Prevents false negatives when there are temporary communication issues. Checks storage directly as a fallback.

### 3. Better Message Handling (`sidebar.js`)

**Before:**

```javascript
default:
    sendResponse({ success: false, error: 'Unknown message type' });
```

**After:**

```javascript
default:
    // Don't show error for unknown message types - just log it
    console.log('Sidebar received unknown message type:', message.type);
    sendResponse({ success: true, note: 'Message type not handled by sidebar' });
```

**Why**: Prevents "Unknown message type" errors from breaking the extension flow. Unknown messages are logged but don't cause failures.

### 4. Improved Initialization Error Handling (`sidebar.js`)

**Before:**

```javascript
// Check authentication status
await this.checkAuthStatus();
```

**After:**

```javascript
// Check authentication status (with error handling)
try {
  await this.checkAuthStatus();
} catch (error) {
  console.error("Error checking auth status on init:", error);
  // Don't fail completely - just assume not authenticated
  this.isAuthenticated = false;
}
```

**Why**: Prevents initialization failures from breaking the entire extension.

### 5. Better clearAuth Error Handling (`api-client.js`)

**Before:**

```javascript
async clearAuth() {
    this.token = null;
    await chrome.storage.sync.remove(['authToken', 'userId', 'userEmail', 'userName']);
}
```

**After:**

```javascript
async clearAuth() {
    if (this.logger) {
        this.logger.warn('Clearing authentication data');
    }
    this.token = null;
    try {
        await chrome.storage.sync.remove(['authToken', 'userId', 'userEmail', 'userName']);
    } catch (error) {
        if (this.logger) {
            this.logger.error('Error clearing auth from storage:', error);
        }
    }
}
```

**Why**: Prevents storage errors from breaking the logout flow.

## How It Works Now

1. **Token Validation**:

   - Checks JWT format (3 parts)
   - Attempts to decode and check expiration
   - If decoding fails, allows token to be used (server will validate)
   - Only clears token if explicitly expired or on 401 error

2. **Authentication Check**:

   - Checks token in storage
   - Validates format and expiration
   - Falls back to storage check if communication fails
   - Doesn't clear token on temporary errors

3. **Error Recovery**:
   - Temporary errors don't cause logout
   - Server-side validation catches invalid tokens
   - Storage is checked as fallback
   - Better logging for debugging

## Testing

After these fixes, the extension should:

- ✅ Remember login after successful authentication
- ✅ Not ask for credentials repeatedly
- ✅ Handle temporary network errors gracefully
- ✅ Only logout on actual token expiration or 401 errors
- ✅ Provide better error messages for debugging

## If Issues Persist

1. **Clear Extension Storage**:

   ```javascript
   // In browser console (chrome://extensions/ → service worker)
   chrome.storage.sync.clear();
   chrome.storage.local.clear();
   ```

2. **Check Service Worker Console**:

   - Go to `chrome://extensions/`
   - Find extension → Click "service worker"
   - Check for authentication errors

3. **Verify Token**:

   ```javascript
   // Check if token exists
   chrome.storage.sync.get(["authToken"], console.log);
   ```

4. **Reload Extension**:
   - Go to `chrome://extensions/`
   - Click reload icon on extension
   - Try logging in again


