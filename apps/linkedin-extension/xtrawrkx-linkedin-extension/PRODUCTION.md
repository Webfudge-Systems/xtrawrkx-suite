# Production Deployment Guide

This guide covers the steps to prepare and deploy the Xtrawrkx LinkedIn Extension for production.

## Pre-Deployment Checklist

### 1. Security & Privacy
- [x] Remove/replace all console.log statements with logger utility
- [x] Remove hardcoded localhost URLs
- [x] Implement error handling with user-friendly messages
- [x] Add configuration validation
- [ ] Add privacy policy (required for Chrome Web Store)
- [ ] Add terms of service
- [ ] Review and update permissions in manifest.json

### 2. Code Quality
- [x] Add logger utility for production-safe logging
- [x] Add error handler utility
- [x] Add config utility for environment management
- [ ] Code review

### 3. Build & Package
- [x] Create package.json with build scripts
- [x] Create build script
- [x] Create package script
- [ ] Run build: `npm run build`
- [ ] Test built extension
- [ ] Create production package: `npm run package`

### 4. Testing
- [ ] Test on different LinkedIn page types (profile, company, search)
- [ ] Test authentication flow
- [ ] Test data extraction
- [ ] Test import functionality
- [ ] Test error scenarios
- [ ] Test on different browsers (Chrome, Edge)
- [ ] Test with different user permissions

### 5. Manifest Configuration
- [x] Add icons configuration
- [x] Remove localhost from host_permissions
- [ ] Update version number
- [ ] Add update_url (when published)
- [ ] Add privacy_policy URL
- [ ] Add content_security_policy

### 6. Documentation
- [x] Update README.md
- [x] Create production deployment guide
- [ ] Add troubleshooting guide
- [ ] Add changelog

## Build Process

### Development Build
```bash
npm install
npm run build
```

This creates a `dist/` folder with the built extension.

### Production Package
```bash
npm run package
```

This creates `xtrawrkx-linkedin-extension.zip` ready for Chrome Web Store submission.

## Chrome Web Store Submission

### Prerequisites
1. Chrome Web Store Developer account ($5 one-time fee)
2. Privacy policy URL (hosted publicly)
3. Terms of service URL (optional but recommended)
4. Extension icons (16x16, 48x48, 128x128)
5. Screenshots (at least 1, recommended 5)
6. Promotional images (1280x800 or 640x400)

### Submission Steps

1. **Prepare Extension Package**
   ```bash
   npm run package
   ```
   Upload `xtrawrkx-linkedin-extension.zip`

2. **Fill Store Listing**
   - Title: "Xtrawrkx LinkedIn Extension"
   - Short description: "Import LinkedIn profiles and companies directly to your CRM"
   - Detailed description: See README.md
   - Category: Productivity
   - Language: English

3. **Privacy & Security**
   - Privacy policy URL (required)
   - Single purpose description
   - Permission justifications

4. **Distribution**
   - Choose: Public, Unlisted, or Private
   - Pricing: Free
   - Regions: All or specific

5. **Submit for Review**
   - Review typically takes 1-3 business days
   - You'll receive email notifications

## Post-Deployment

### Monitoring
- Monitor error logs
- Track user feedback
- Monitor API usage
- Check extension analytics in Chrome Web Store

### Updates
1. Update version in `manifest.json`
2. Update `CHANGELOG.md`
3. Run build and package
4. Upload new version to Chrome Web Store
5. Submit for review

## Environment Configuration

### Production
- API URL: `https://xtrawrkxsuits-production.up.railway.app`
- Debug mode: Disabled
- Error reporting: Enabled

### Development
- API URL: `http://localhost:1337` (configurable)
- Debug mode: Enabled
- Error reporting: Disabled

## Troubleshooting

### Common Issues

1. **Extension not loading**
   - Check manifest.json syntax
   - Verify all files exist
   - Check browser console for errors

2. **API connection fails**
   - Verify API URL is correct
   - Check CORS configuration on backend
   - Verify network connectivity

3. **Data extraction fails**
   - Check LinkedIn page structure hasn't changed
   - Verify selectors are still valid
   - Check browser console for errors

## Security Considerations

1. **Never commit sensitive data**
   - Use environment variables
   - Use Chrome storage for user config

2. **Validate all inputs**
   - API URLs
   - User credentials
   - Extracted data

3. **Sanitize logs**
   - Remove passwords/tokens from logs
   - Use logger utility for all logging

4. **Content Security Policy**
   - Restrict script sources
   - Validate all external resources

## Support

For issues or questions:
- Check README.md
- Review troubleshooting guide
- Contact support: support@xtrawrkx.com


