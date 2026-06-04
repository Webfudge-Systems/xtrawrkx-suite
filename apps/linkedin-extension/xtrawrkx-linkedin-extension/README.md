# XtraWrkx LinkedIn Extension

A Chrome browser extension that allows users to import leads, companies, and contacts directly from LinkedIn into their XtraWrkx CRM system.

## Features

- **Profile Import**: Import LinkedIn profile data as contacts in your CRM
- **Company Import**: Import LinkedIn company pages as lead companies
- **Search Results**: Bulk import multiple profiles or companies from search results
- **One-Click Import**: Simple button overlay on LinkedIn pages
- **Duplicate Detection**: Prevents importing duplicate contacts and companies
- **Real-time Sync**: Direct integration with XtraWrkx CRM API

## Installation

### For Development

1. **Clone or Download** the extension files to your local machine

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `xtrawrkx-linkedin-extension` folder

4. **Pin Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Pin the XtraWrkx extension for easy access

### For Production

1. **Chrome Web Store** (when published)
   - Visit the Chrome Web Store
   - Search for "XtraWrkx LinkedIn Importer"
   - Click "Add to Chrome"

## Configuration

### First Time Setup

1. **Open Extension Options**
   - Click the extension icon in your toolbar
   - Click "Settings" or right-click the icon and select "Options"

2. **Configure API Connection**
   - Enter your XtraWrkx CRM URL (e.g., `https://your-crm.com` or `http://localhost:1337`)
   - Click "Test Connection" to verify

3. **Authenticate**
   - Enter your XtraWrkx CRM email and password
   - Click "Sign In"

4. **Configure Import Settings**
   - Enable/disable auto-assignment of imported items
   - Enable/disable duplicate checking
   - Enable/disable notifications

## Usage

### Importing LinkedIn Profiles

1. **Navigate to LinkedIn Profile**
   - Visit any LinkedIn profile page (e.g., `linkedin.com/in/john-doe`)

2. **Import Profile**
   - Click the "Import to XtraWrkx" button that appears on the page
   - Or click the extension icon and select "Import Current Page"

3. **Verify Import**
   - Check your XtraWrkx CRM contacts section
   - The profile will be added as a new contact

### Importing Company Pages

1. **Navigate to LinkedIn Company**
   - Visit any LinkedIn company page (e.g., `linkedin.com/company/example-corp`)

2. **Import Company**
   - Click the "Import to XtraWrkx" button
   - Or use the extension popup

3. **Verify Import**
   - Check your XtraWrkx CRM lead companies section
   - The company will be added as a new lead company

### Bulk Import from Search

1. **Perform LinkedIn Search**
   - Search for people or companies on LinkedIn
   - Navigate to search results page

2. **Bulk Import**
   - Click the extension icon
   - Select "Bulk Import" (coming soon)
   - Choose which results to import

## Data Mapping

### Profile → Contact
- **Name**: LinkedIn full name → First Name + Last Name
- **Email**: LinkedIn email (if available)
- **Title**: LinkedIn headline → Job Title
- **Company**: Current company → Company field
- **Location**: LinkedIn location → Address
- **LinkedIn URL**: Profile URL → LinkedIn field
- **Source**: Set to "EXTENSION"

### Company → Lead Company
- **Name**: Company name
- **Industry**: LinkedIn industry
- **Website**: Company website
- **Description**: Company about section
- **Employees**: Employee count range
- **Location**: Company headquarters
- **LinkedIn URL**: Company page URL
- **Source**: Set to "SOCIAL_MEDIA"

## Troubleshooting

### Extension Not Working

1. **Check Authentication**
   - Open extension options
   - Verify you're signed in
   - Re-authenticate if needed

2. **Check API Connection**
   - Test connection in options
   - Verify CRM URL is correct
   - Ensure CRM is accessible

3. **Check LinkedIn Page**
   - Extension only works on LinkedIn.com
   - Refresh the page if button doesn't appear
   - Check browser console for errors

### Import Failures

1. **Duplicate Detection**
   - Contact/company may already exist
   - Check CRM for existing records
   - Disable duplicate checking if needed

2. **Missing Data**
   - Some LinkedIn profiles have limited public data
   - Ensure required fields are available
   - Check validation errors in console

3. **API Errors**
   - Check CRM server status
   - Verify authentication token
   - Check network connectivity

### Performance Issues

1. **Slow Imports**
   - Large imports may take time
   - Check network connection
   - Avoid importing too many items at once

2. **Memory Usage**
   - Close unused tabs
   - Restart browser if needed
   - Clear extension storage if necessary

## Privacy & Security

- **Data Handling**: Extension only processes data you explicitly choose to import
- **Authentication**: Uses secure token-based authentication
- **Storage**: Minimal data stored locally (auth tokens, settings)
- **Permissions**: Only requests necessary permissions for LinkedIn and your CRM

## Support

### Getting Help

1. **Documentation**: Check this README and CRM documentation
2. **Extension Options**: Use the "Contact Support" link in options
3. **CRM Support**: Contact your XtraWrkx administrator

### Reporting Issues

When reporting issues, please include:
- Chrome version
- Extension version
- LinkedIn page URL (if applicable)
- Error messages from browser console
- Steps to reproduce the issue

## Development

### File Structure

```
xtrawrkx-linkedin-extension/
├── manifest.json              # Extension manifest
├── src/
│   ├── background/
│   │   └── service-worker.js  # Background service worker
│   ├── content/
│   │   ├── linkedin-extractor.js  # LinkedIn data extraction
│   │   └── styles.css         # Content script styles
│   ├── popup/
│   │   ├── popup.html         # Extension popup
│   │   ├── popup.js           # Popup functionality
│   │   └── popup.css          # Popup styles
│   ├── options/
│   │   ├── options.html       # Options page
│   │   ├── options.js         # Options functionality
│   │   └── options.css        # Options styles
│   └── utils/
│       ├── api-client.js      # CRM API client
│       └── data-mapper.js     # Data mapping utilities
└── icons/
    ├── icon16.png             # 16x16 icon
    ├── icon48.png             # 48x48 icon
    └── icon128.png            # 128x128 icon
```

### Building for Production

1. **Update Manifest**
   - Set production API URLs
   - Update version number
   - Add Chrome Web Store metadata

2. **Create Package**
   - Zip the entire extension folder
   - Exclude development files (.git, README, etc.)

3. **Test Thoroughly**
   - Test on different LinkedIn page types
   - Test with different CRM configurations
   - Test error scenarios

## Version History

### v1.0.0 (Current)
- Initial release
- Profile and company import
- Basic authentication and configuration
- Duplicate detection
- Real-time notifications

### Planned Features
- Bulk import from search results
- Advanced filtering options
- Import history and analytics
- Custom field mapping
- Team collaboration features

## License

This extension is proprietary software for XtraWrkx CRM users.
Unauthorized distribution or modification is prohibited.





