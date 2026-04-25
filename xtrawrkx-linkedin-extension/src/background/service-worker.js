/**
 * XtraWrkx LinkedIn Extension Background Service Worker
 * Handles API communication and background tasks
 */

// Import utilities (using importScripts for service worker)
// In Manifest V3, paths in importScripts are resolved relative to the extension root
// However, Chrome may resolve them relative to the service worker file location
// Using relative paths: from src/background/ go up one level (../) to src/, then into utils/
// IMPORTANT: config.js must be loaded before api-client.js
importScripts(
    '../utils/logger.js',
    '../utils/config.js',
    '../utils/error-handler.js',
    '../utils/api-client.js',
    '../utils/data-mapper.js'
);

class BackgroundService {
    constructor() {
        this.apiClient = null;
        this.dataMapper = null;
        this.initialized = false;

        // Initialize logger and error handler if available
        try {
            this.logger = typeof getLogger !== 'undefined' ? getLogger() : null;
            this.errorHandler = typeof getErrorHandler !== 'undefined' ? getErrorHandler() : null;
        } catch (error) {
            console.error('Error initializing utilities:', error);
            this.logger = null;
            this.errorHandler = null;
        }

        // Set up event listeners FIRST so messages can be handled even during initialization
        this.setupEventListeners();

        // Then initialize asynchronously
        this.init();
    }

    async init() {
        try {
            // Initialize API client and data mapper
            if (typeof ExtensionApiClient !== 'undefined') {
                this.apiClient = new ExtensionApiClient();
            }
            if (typeof DataMapper !== 'undefined') {
                this.dataMapper = new DataMapper();
            }

            // Set up sidePanel globally (disabled by default, enabled per-tab for LinkedIn)
            await this.setupSidePanel();

            // Initialize extension icon state for all tabs
            await this.initializeExtensionIcons();

            this.initialized = true;

            if (this.logger) {
                this.logger.log('XtraWrkx Extension Background Service initialized');
            } else {
            }
        } catch (error) {
            console.error('Error initializing background service:', error);
            console.error('Error stack:', error.stack);
            // Service can still handle messages even if initialization fails
            this.initialized = false;
        }
    }

    async setupSidePanel() {
        try {
            // Set global sidePanel configuration - DISABLED by default
            // Will be enabled only for LinkedIn tabs
            if (chrome.sidePanel && chrome.sidePanel.setOptions) {
                // Don't enable globally - only enable for LinkedIn tabs
                // This prevents sidePanel from appearing on non-LinkedIn pages
                if (this.logger) {
                    this.logger.log('SidePanel API available - will be enabled per-tab for LinkedIn only');
                } else {
                }
                
                // Check all current tabs and enable/disable sidePanel accordingly
                const tabs = await chrome.tabs.query({});
                for (const tab of tabs) {
                    if (tab.url && this.isLinkedInUrl(tab.url)) {
                        await chrome.sidePanel.setOptions({
                            tabId: tab.id,
                            enabled: true,
                            path: 'src/sidebar/sidebar.html'
                        });
                    } else {
                        await chrome.sidePanel.setOptions({
                            tabId: tab.id,
                            enabled: false
                        });
                    }
                }
            } else {
                const errorMsg = 'Chrome sidePanel API not available';
                if (this.logger) {
                    this.logger.error(errorMsg);
                } else {
                    console.error(errorMsg);
                }
            }
        } catch (error) {
            if (this.logger) {
                this.logger.error('Failed to setup sidePanel:', error);
            } else {
                console.error('Failed to setup sidePanel:', error);
            }
        }
    }

    setupEventListeners() {
        // Listen for messages from content scripts and popup
        const self = this;
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            // Handle messages even if service isn't fully initialized
            try {
                if (message.type === 'OPEN_SIDEPANEL_WITH_GESTURE') {
                    // Try main handler first, fallback to simple handler if needed
                    if (self.handleMessage && typeof self.handleMessage === 'function') {
                        self.handleMessage(message, sender, sendResponse);
                    } else {
                        self.handleOpenSidePanelFallback(message, sender, sendResponse);
                    }
                } else if (self.handleMessage && typeof self.handleMessage === 'function') {
                    self.handleMessage(message, sender, sendResponse);
                } else {
                    sendResponse({ success: false, error: 'Service not initialized yet' });
                }
            } catch (error) {
                console.error('Error handling message:', error);
                sendResponse({ success: false, error: error.message || 'Unknown error' });
            }
            return true; // Keep message channel open for async response
        });

        // Listen for extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Listen for tab updates to inject content scripts if needed
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });

        // Listen for tab activation/switching
        chrome.tabs.onActivated.addListener(async (activeInfo) => {
            await this.handleTabActivation(activeInfo);
        });

        // Listen for window focus changes
        chrome.windows.onFocusChanged.addListener(async (windowId) => {
            if (windowId !== chrome.windows.WINDOW_ID_NONE) {
                await this.handleWindowFocus(windowId);
            }
        });

        // Note: tab updates are already handled by handleTabUpdate above
        // No need for duplicate listener

        // Listen for action (toolbar button) clicks to open sidePanel
        chrome.action.onClicked.addListener((tab) => {
            this.handleActionClick(tab);
        });
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            // Handle sidePanel opening immediately to preserve user gesture
            if (message.type === 'OPEN_SIDEPANEL_WITH_GESTURE') {
                // CRITICAL: Open sidePanel synchronously to preserve user gesture
                const tab = sender.tab;
                if (!tab) {
                    const error = 'No sender tab found';
                    if (this.logger) {
                        this.logger.error(error);
                    } else {
                        console.error(error);
                    }
                    sendResponse({ success: false, error });
                    return true;
                }

                if (!this.isLinkedInUrl(tab.url)) {
                    const error = 'This extension only works on LinkedIn pages';
                    sendResponse({ success: false, error });
                    return true;
                }

                // Check if sidePanel API is available
                if (!chrome.sidePanel || !chrome.sidePanel.open) {
                    const error = 'Chrome sidePanel API not available. Please update Chrome to version 114 or higher.';
                    if (this.logger) {
                        this.logger.error(error);
                    } else {
                        console.error(error);
                    }
                    sendResponse({ success: false, error });
                    return true;
                }

                // Verify tab is still LinkedIn before opening
                if (!this.isLinkedInUrl(tab.url)) {
                    const error = 'This extension only works on LinkedIn pages';
                    sendResponse({ success: false, error });
                    return true;
                }

                // Set options for this tab first
                try {
                    if (chrome.sidePanel.setOptions) {
                        chrome.sidePanel.setOptions({
                            enabled: true,
                            path: 'src/sidebar/sidebar.html',
                            tabId: tab.id
                        });
                    }
                } catch (setError) {
                    if (this.logger) {
                        this.logger.error('Failed to set sidePanel options:', setError);
                    } else {
                        console.error('Failed to set sidePanel options:', setError);
                    }
                    // Continue anyway - might still work
                }

                // CRITICAL: Call open() immediately in the same call stack to preserve user gesture
                try {
                    chrome.sidePanel.open({ tabId: tab.id })
                        .then(() => {
                            if (this.logger) {
                                this.logger.log('SidePanel opened successfully');
                            } else {
                            }
                            sendResponse({ success: true });
                        })
                        .catch((error) => {
                            const errorMsg = error.message || 'Failed to open sidePanel';
                            if (this.logger) {
                                this.logger.error('Failed to open sidePanel:', error);
                            } else {
                                console.error('Failed to open sidePanel:', error);
                            }

                            // Provide user-friendly error message
                            let userMessage = errorMsg;
                            if (errorMsg.includes('user gesture')) {
                                userMessage = 'User gesture lost. Please click the extension icon in the toolbar to open the sidebar.';
                            } else if (errorMsg.includes('not enabled')) {
                                userMessage = 'SidePanel is not enabled. Please check extension settings.';
                            }

                            sendResponse({
                                success: false,
                                error: userMessage
                            });
                        });
                } catch (openError) {
                    const errorMsg = openError.message || 'Failed to open sidePanel';
                    if (this.logger) {
                        this.logger.error('Exception opening sidePanel:', openError);
                    } else {
                        console.error('Exception opening sidePanel:', openError);
                    }
                    sendResponse({
                        success: false,
                        error: errorMsg
                    });
                }

                return true; // Keep channel open for async response
            }

            switch (message.type) {
                case 'FIND_EXISTING_CONTACT':
                    const existingContact = await this.handleFindExistingContact(message.linkedInUrl);
                    sendResponse(existingContact);
                    break;

                case 'GET_CONTACT_RELATED_DATA':
                    const relatedData = await this.handleGetContactRelatedData(message.contactId);
                    sendResponse(relatedData);
                    break;

                case 'GET_COMPANY_DATA':
                    const companyData = await this.handleGetCompanyData(message.companyId, message.companyType);
                    sendResponse(companyData);
                    break;

                case 'SEARCH_COMPANY_BY_NAME':
                    const searchResult = await this.handleSearchCompanyByName(message.companyName);
                    sendResponse(searchResult);
                    break;

                case 'IMPORT_CURRENT_PAGE':
                    const result = await this.handleImportCurrentPage(message.data);
                    sendResponse(result);
                    break;

                case 'SUBMIT_PROFILE_HTML_CAPTURE':
                    const captureResult = await this.handleSubmitProfileHtmlCapture(message.payload);
                    sendResponse(captureResult);
                    break;

                case 'GENERATE_LINKEDIN_OUTREACH':
                    const outreachResult = await this.handleGenerateLinkedInOutreach(message.payload);
                    sendResponse(outreachResult);
                    break;

                case 'IMPORT_BULK':
                    const bulkResult = await this.handleBulkImport(message.data);
                    sendResponse(bulkResult);
                    break;

                case 'CHECK_AUTH':
                    const authStatus = await this.checkAuthStatus();
                    sendResponse(authStatus);
                    break;

                case 'GET_CONFIG':
                    const config = await this.getConfiguration();
                    sendResponse(config);
                    break;

                case 'OPEN_OPTIONS':
                    chrome.runtime.openOptionsPage();
                    sendResponse({ success: true });
                    break;

                case 'AUTHENTICATE':
                    const authResult = await this.handleAuthenticate(message.email, message.password);
                    sendResponse(authResult);
                    break;

                case 'VERIFY_AUTH':
                    const verifyResult = await this.handleVerifyAuth();
                    sendResponse(verifyResult);
                    break;

                case 'OPEN_SIDEPANEL':
                    // Open sidePanel immediately to preserve user gesture context
                    this.handleOpenSidePanel().then(result => {
                        sendResponse(result);
                    }).catch(error => {
                        sendResponse({ success: false, error: error.message });
                    });
                    return true; // Keep channel open for async response

                case 'PAGE_DATA_FOR_SIDEBAR':
                    const pageDataResult = await this.handlePageDataForSidebar(message.data, message.url, message.timestamp);
                    sendResponse(pageDataResult);
                    break;

                case 'OPEN_POPUP_FALLBACK':
                    // Fallback for older Chrome versions - open popup
                    try {
                        // Note: We can't programmatically open popup, but we can notify user
                        sendResponse({ success: true, message: 'Click the extension icon in the toolbar' });
                    } catch (error) {
                        sendResponse({ success: false, error: error.message });
                    }
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Background message handler error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    // Find existing contact handler
    async handleFindExistingContact(linkedInUrl) {

        try {
            await this.apiClient.init();

            const existingContact = await this.apiClient.findExistingContact(linkedInUrl);

            if (existingContact) {
                return { success: true, exists: true, contact: existingContact };
            } else {
                return { success: true, exists: false, contact: null };
            }
        } catch (error) {
            console.error('❌ Error finding existing contact:', error);
            return { success: false, error: error.message };
        }
    }

    async handleGetContactRelatedData(contactId) {

        try {
            await this.apiClient.init();

            const relatedData = await this.apiClient.getContactRelatedData(contactId);

            return { success: true, data: relatedData };

        } catch (error) {
            console.error('❌ Error fetching contact related data:', error);
            return { success: false, error: error.message };
        }
    }

    async handleGetCompanyData(companyId, companyType) {

        try {
            await this.apiClient.init();

            let companyData = null;

            if (companyType === 'client' || companyType === 'account') {
                // Both 'client' and 'account' should fetch from client-accounts
                companyData = await this.apiClient.getCompanyData(companyId);
            } else if (companyType === 'lead') {
                companyData = await this.apiClient.getLeadCompanyData(companyId);
            } else {
                companyData = await this.apiClient.getCompanyData(companyId);
            }

            return { success: true, data: companyData };

        } catch (error) {
            console.error('❌ Error fetching company data:', error);
            return { success: false, error: error.message };
        }
    }

    async handleSearchCompanyByName(companyName) {

        try {
            await this.apiClient.init();

            const companyData = await this.apiClient.searchCompanyByName(companyName);

            if (companyData) {
                return { success: true, data: companyData };
            } else {
                return { success: false, error: 'Company not found' };
            }

        } catch (error) {
            console.error('❌ Error searching company by name:', error);
            return { success: false, error: error.message };
        }
    }

    async handleImportCurrentPage(pageData) {
        try {
            if (!pageData || !pageData.type) {
                throw new Error('Invalid page data');
            }

            // Check authentication
            const isAuthenticated = await this.apiClient.verifyAuth();
            if (!isAuthenticated) {
                throw new Error('Not authenticated. Please sign in through the extension options.');
            }

            // Get user ID for assignment
            const userId = await this.apiClient.getUserId();

            let result;
            switch (pageData.type) {
                case 'profile':
                    result = await this.importProfile(pageData.data, userId);
                    break;
                case 'company':
                    result = await this.importCompany(pageData.data, userId);
                    break;
                case 'search':
                    result = await this.importSearchResults(pageData.data, userId);
                    break;
                default:
                    throw new Error(`Unsupported page type: ${pageData.type}`);
            }

            // Store import record
            await this.storeImportRecord(result, pageData.type);

            // Show notification if enabled
            await this.showImportNotification(result, pageData.type);

            return {
                success: true,
                message: `Successfully imported ${pageData.type}`,
                data: result
            };

        } catch (error) {
            console.error('Import failed:', error);

            // Show error notification
            await this.showErrorNotification(error.message);

            return {
                success: false,
                error: error.message
            };
        }
    }

    async handleSubmitProfileHtmlCapture(payload) {
        try {
            if (!payload || typeof payload.html !== 'string' || !payload.url) {
                throw new Error('Invalid capture payload');
            }

            const isAuthenticated = await this.apiClient.verifyAuth();
            if (!isAuthenticated) {
                throw new Error('Not authenticated. Please sign in through the extension options.');
            }

            const userId = await this.apiClient.getUserId();
            const data = await this.apiClient.syncLinkedInEnrichedProfile({
                ...payload,
                assignedTo: userId || undefined,
                storeHtml: true,
            });

            return {
                success: true,
                data,
            };
        } catch (error) {
            console.error('Profile HTML capture submit failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async handleGenerateLinkedInOutreach(payload) {
        try {
            await this.apiClient.init();
            const raw = await this.apiClient.generateLinkedInOutreach(payload);
            const variants = raw && raw.data !== undefined ? raw.data : raw;
            return {
                success: true,
                data: variants,
            };
        } catch (error) {
            console.error('Generate LinkedIn outreach failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async importProfile(profileData, userId) {

        // Check for duplicates if enabled
        const settings = await this.getImportSettings();

        if (settings.checkDuplicates) {
            const isDuplicate = await this.apiClient.checkDuplicateContact(
                profileData.email,
                profileData.linkedInUrl || profileData.profileUrl
            );

            if (isDuplicate) {
                throw new Error('Contact already exists in CRM');
            }
        }

        // Step 1: Create lead company if currentCompany exists
        let leadCompanyResult = null;
        const companyName = profileData.currentCompany || profileData.company;

        if (companyName) {

            try {
                // Check for duplicate company if enabled
                if (settings.checkDuplicates) {
                    const isDuplicateCompany = await this.apiClient.checkDuplicateCompany(
                        profileData.linkedInUrl || profileData.profileUrl
                    );

                    if (isDuplicateCompany) {
                        // Try to find existing company by name
                        // For now, we'll still create the contact without linking
                    } else {
                        // Map company data from profile
                        const leadCompanyData = this.dataMapper.mapProfileCompanyToLeadCompany(profileData, userId);

                        if (leadCompanyData) {
                            // Validate company data
                            const companyValidation = this.dataMapper.validateLeadCompany(leadCompanyData);
                            if (companyValidation.isValid) {
                                // Create lead company
                                leadCompanyResult = await this.apiClient.createLeadCompany(leadCompanyData);
                            } else {
                            }
                        }
                    }
                } else {
                    // Map company data from profile
                    const leadCompanyData = this.dataMapper.mapProfileCompanyToLeadCompany(profileData, userId);

                    if (leadCompanyData) {
                        // Validate company data
                        const companyValidation = this.dataMapper.validateLeadCompany(leadCompanyData);
                        if (companyValidation.isValid) {
                            // Create lead company
                            leadCompanyResult = await this.apiClient.createLeadCompany(leadCompanyData);
                        } else {
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Error creating lead company:', error);
                // Continue with contact creation even if company creation fails
            }
        }

        // Step 2: Map profile data to contact format
        const contactData = this.dataMapper.mapProfileToContact(profileData, userId);

        // Link contact to lead company if created
        if (leadCompanyResult && leadCompanyResult.data && leadCompanyResult.data.id) {
            contactData.leadCompany = leadCompanyResult.data.id;
        }

        // Validate contact data
        const validation = this.dataMapper.validateContact(contactData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Step 3: Create contact
        const contactResult = await this.apiClient.createContact(contactData);

        return {
            type: 'contact',
            id: contactResult.data.id,
            name: `${contactData.firstName} ${contactData.lastName}`.trim(),
            data: contactResult.data,
            leadCompany: leadCompanyResult ? {
                id: leadCompanyResult.data.id,
                name: leadCompanyResult.data.companyName,
                data: leadCompanyResult.data
            } : null
        };
    }

    async importCompany(companyData, userId) {
        // Check for duplicates if enabled
        const settings = await this.getImportSettings();

        if (settings.checkDuplicates) {
            const isDuplicate = await this.apiClient.checkDuplicateCompany(
                companyData.linkedInUrl || companyData.companyUrl
            );

            if (isDuplicate) {
                throw new Error('Company already exists in CRM');
            }
        }

        // Map company data to lead company format
        const leadCompanyData = this.dataMapper.mapCompanyToLeadCompany(companyData, userId);

        // Validate data
        const validation = this.dataMapper.validateLeadCompany(leadCompanyData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Create lead company
        const result = await this.apiClient.createLeadCompany(leadCompanyData);

        return {
            type: 'lead-company',
            id: result.data.id,
            name: leadCompanyData.companyName,
            data: result.data
        };
    }

    async importSearchResults(searchData, userId) {
        if (!searchData.results || searchData.results.length === 0) {
            throw new Error('No search results to import');
        }

        const results = [];
        const errors = [];

        // Import each result
        for (const result of searchData.results) {
            try {
                let importResult;

                if (result.type === 'profile') {
                    importResult = await this.importProfile(result.data, userId);
                } else if (result.type === 'company') {
                    importResult = await this.importCompany(result.data, userId);
                }

                if (importResult) {
                    results.push(importResult);
                }
            } catch (error) {
                errors.push({
                    item: result.data.name || result.data.fullName || 'Unknown',
                    error: error.message
                });
            }
        }

        if (results.length === 0 && errors.length > 0) {
            throw new Error(`All imports failed. First error: ${errors[0].error}`);
        }

        return {
            type: 'bulk-import',
            successCount: results.length,
            errorCount: errors.length,
            results: results,
            errors: errors
        };
    }

    async handleBulkImport(bulkData) {
        try {
            const userId = await this.apiClient.getUserId();
            const results = [];
            const errors = [];

            for (const item of bulkData.items) {
                try {
                    let result;

                    if (item.type === 'profile') {
                        result = await this.importProfile(item.data, userId);
                    } else if (item.type === 'company') {
                        result = await this.importCompany(item.data, userId);
                    }

                    if (result) {
                        results.push(result);
                    }
                } catch (error) {
                    errors.push({
                        item: item.data.name || item.data.fullName || 'Unknown',
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                message: `Imported ${results.length} items, ${errors.length} failed`,
                data: {
                    successCount: results.length,
                    errorCount: errors.length,
                    results: results,
                    errors: errors
                }
            };

        } catch (error) {
            console.error('Bulk import failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async handleAuthenticate(email, password) {
        try {

            if (!email || !password) {
                return {
                    success: false,
                    error: 'Email and password are required'
                };
            }

            // Ensure API client is initialized
            if (!this.apiClient) {
                this.apiClient = new ExtensionApiClient();
                await this.apiClient.init();
            }


            // Use API client to authenticate
            const result = await this.apiClient.authenticate(email, password);

            if (result && result.success) {
                return {
                    success: true,
                    user: result.user
                };
            } else {
                return {
                    success: false,
                    error: result?.error || 'Authentication failed. Please check your credentials.'
                };
            }
        } catch (error) {
            console.error('Handle authenticate error:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);

            // Provide more detailed error messages
            let errorMessage = 'Authentication failed';
            if (error.message) {
                if (error.message.includes('fetch')) {
                    errorMessage = 'Unable to connect to server. Please check your internet connection and API URL settings.';
                } else if (error.message.includes('HTTP 401') || error.message.includes('Invalid credentials')) {
                    errorMessage = 'Invalid email or password';
                } else if (error.message.includes('HTTP 400')) {
                    errorMessage = 'Invalid request. Please check your credentials.';
                } else if (error.message.includes('HTTP 500')) {
                    errorMessage = 'Server error. Please try again later.';
                } else {
                    errorMessage = error.message;
                }
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    async handleVerifyAuth() {
        try {
            // Ensure API client is initialized
            if (!this.apiClient) {
                this.apiClient = new ExtensionApiClient();
                await this.apiClient.init();
            }

            const isAuthenticated = await this.apiClient.verifyAuth();
            return {
                authenticated: isAuthenticated
            };
        } catch (error) {
            console.error('Handle verify auth error:', error);
            return {
                authenticated: false,
                error: error.message
            };
        }
    }

    isLinkedInUrl(url) {
        if (!url) return false;
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('linkedin.com');
        } catch (e) {
            return false;
        }
    }

    async handleOpenSidePanel() {
        try {

            // Check Chrome version and sidePanel API availability

            // Force sidePanel API usage - no fallback
            if (!chrome.sidePanel || !chrome.sidePanel.open) {
                console.error('Chrome sidePanel API not available');
                return {
                    success: false,
                    error: 'Chrome sidePanel API not available. Please update Chrome to version 114 or higher.'
                };
            }

            // Get the current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                console.error('No active tab found');
                return { success: false, error: 'No active tab found' };
            }

            // Check if tab is LinkedIn
            if (!this.isLinkedInUrl(tab.url)) {
                // Close sidePanel if it's open for this tab
                try {
                    await chrome.sidePanel.setOptions({
                        tabId: tab.id,
                        enabled: false
                    });
                } catch (e) {
                }
                return {
                    success: false,
                    error: 'This extension only works on LinkedIn pages'
                };
            }


            // Enable sidePanel for this tab first
            try {
                await chrome.sidePanel.setOptions({
                    tabId: tab.id,
                    enabled: true,
                    path: 'src/sidebar/sidebar.html'
                });
            } catch (setError) {
            }

            // Try to open sidePanel - might fail if no user gesture
            try {
                await chrome.sidePanel.open({ tabId: tab.id });
                return { success: true };
            } catch (openError) {
                console.error('Failed to open sidePanel:', openError);
                // If it fails due to no gesture, suggest clicking extension icon
                if (openError.message && openError.message.includes('user gesture')) {
                    return {
                        success: false,
                        error: 'No user gesture. Please click the extension icon in the toolbar.'
                    };
                }
                throw openError;
            }

        } catch (error) {
            console.error('Failed to open side panel:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);

            return {
                success: false,
                error: `sidePanel failed: ${error.message}. Make sure Chrome supports sidePanel API (version 114+)`
            };
        }
    }

    async handleOpenSidePanelWithGesture(sender) {
        try {

            // Check if sidePanel API is available
            if (!chrome.sidePanel || !chrome.sidePanel.open) {
                console.error('Chrome sidePanel API not available');
                return {
                    success: false,
                    error: 'Chrome sidePanel API not available. Please update Chrome to version 114 or higher.'
                };
            }

            // Get the tab that sent the message
            const tab = sender.tab;
            if (!tab) {
                console.error('No sender tab found');
                return { success: false, error: 'No sender tab found' };
            }

            // Check if tab is LinkedIn
            if (!this.isLinkedInUrl(tab.url)) {
                return {
                    success: false,
                    error: 'This extension only works on LinkedIn pages'
                };
            }


            // Enable sidePanel for this tab first
            try {
                await chrome.sidePanel.setOptions({
                    tabId: tab.id,
                    enabled: true,
                    path: 'src/sidebar/sidebar.html'
                });
            } catch (setError) {
            }

            // Try to open immediately - user gesture should still be valid
            try {
                await chrome.sidePanel.open({ tabId: tab.id });
                return { success: true };
            } catch (openError) {
                console.error('sidePanel.open() failed:', openError);

                // If gesture error, suggest clicking extension icon
                if (openError.message && openError.message.includes('user gesture')) {
                    return {
                        success: false,
                        error: 'User gesture lost. Please click the extension icon in the toolbar.'
                    };
                }
                throw openError;
            }

        } catch (error) {
            console.error('Failed to open side panel with gesture:', error);
            return {
                success: false,
                error: `sidePanel with gesture failed: ${error.message}`
            };
        }
    }

    async handlePageDataForSidebar(pageData, url, timestamp) {
        try {

            // Store page data for sidebar to access
            await chrome.storage.local.set({
                lastPageData: pageData,
                lastPageUrl: url,
                pageDataTimestamp: timestamp || Date.now()
            });

            return { success: true };
        } catch (error) {
            console.error('❌ Failed to handle page data for sidebar:', error);
            return { success: false, error: error.message };
        }
    }

    async checkAuthStatus() {
        try {
            const isAuthenticated = await this.apiClient.verifyAuth();
            const config = await this.apiClient.getStoredConfig();

            return {
                success: true,
                authenticated: isAuthenticated,
                user: {
                    email: config.userEmail,
                    name: config.userName
                }
            };
        } catch (error) {
            return {
                success: false,
                authenticated: false,
                error: error.message
            };
        }
    }

    async getConfiguration() {
        try {
            const config = await this.apiClient.getStoredConfig();
            const importSettings = await this.getImportSettings();

            return {
                success: true,
                config: {
                    ...config,
                    ...importSettings
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getImportSettings() {
        const settings = await chrome.storage.sync.get([
            'autoAssign',
            'checkDuplicates',
            'showNotifications'
        ]);

        return {
            autoAssign: settings.autoAssign !== false,
            checkDuplicates: settings.checkDuplicates !== false,
            showNotifications: settings.showNotifications !== false
        };
    }

    async storeImportRecord(result, type) {
        try {
            const record = {
                id: Date.now().toString(),
                type: type,
                name: result.name,
                timestamp: new Date().toISOString(),
                status: 'success',
                crmId: result.id
            };

            // Get existing records
            const storage = await chrome.storage.local.get(['recentImports']);
            const recentImports = storage.recentImports || [];

            // Add new record at the beginning
            recentImports.unshift(record);

            // Keep only last 50 records
            const trimmedImports = recentImports.slice(0, 50);

            // Save back to storage
            await chrome.storage.local.set({ recentImports: trimmedImports });

        } catch (error) {
            console.error('Failed to store import record:', error);
        }
    }

    async showImportNotification(result, type) {
        const settings = await this.getImportSettings();

        if (!settings.showNotifications) {
            return;
        }

        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: '../icons/icon48.png',
                title: 'XtraWrkx Import Successful',
                message: `Successfully imported ${result.name} as ${type}`
            });
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    async showErrorNotification(errorMessage) {
        const settings = await this.getImportSettings();

        if (!settings.showNotifications) {
            return;
        }

        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: '../icons/icon48.png',
                title: 'XtraWrkx Import Failed',
                message: errorMessage
            });
        } catch (error) {
            console.error('Failed to show error notification:', error);
        }
    }

    handleInstallation(details) {
        if (details.reason === 'install') {
            // Open options page on first install
            chrome.runtime.openOptionsPage();
        }
    }

    async handleActionClick(tab) {
        try {

            // Check if tab is LinkedIn
            if (!this.isLinkedInUrl(tab.url)) {
                // Show notification that extension only works on LinkedIn
                try {
                    await chrome.notifications.create({
                        type: 'basic',
                        iconUrl: '../icons/icon48.png',
                        title: 'Xtrawrkx Extension',
                        message: 'This extension only works on LinkedIn pages. Please navigate to LinkedIn first.'
                    });
                } catch (notifError) {
                }
                return;
            }

            // Ensure sidePanel is enabled for this tab
            if (chrome.sidePanel && chrome.sidePanel.setOptions) {
                try {
                    await chrome.sidePanel.setOptions({
                        tabId: tab.id,
                        enabled: true,
                        path: 'src/sidebar/sidebar.html'
                    });
                } catch (setError) {
                }
            }

            // This has proper user gesture context from toolbar button click
            await chrome.sidePanel.open({ tabId: tab.id });

        } catch (error) {
            console.error('Failed to open side panel from action click:', error);
            console.error('Error message:', error.message);
        }
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        // Only process if tab URL is available
        if (!tab || !tab.url) return;

        // Check if this is a LinkedIn page
        const isLinkedIn = this.isLinkedInUrl(tab.url);

        // Inject content script only on LinkedIn pages
        if (changeInfo.status === 'complete' && isLinkedIn) {
            // Content script should already be injected via manifest
            // This is just for any edge cases
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['src/content/linkedin-extractor.js']
            }).catch(error => {
                // Ignore errors - content script might already be injected
            });
        }

        // Check and close sidePanel on URL change (immediate) or page complete
        // This ensures sidePanel closes immediately when navigating away from LinkedIn
        if (changeInfo.url || changeInfo.status === 'complete') {
            this.checkAndCloseSidePanel(tab);
        }
    }

    async handleTabActivation(activeInfo) {
        try {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            await this.checkAndCloseSidePanel(tab);
            // Update extension icon state based on tab
            this.updateExtensionIcon(tab);
        } catch (error) {
            console.error('Error handling tab activation:', error);
        }
    }

    async handleWindowFocus(windowId) {
        try {
            const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
            if (tabs && tabs.length > 0) {
                await this.checkAndCloseSidePanel(tabs[0]);
                this.updateExtensionIcon(tabs[0]);
            }
        } catch (error) {
            console.error('Error handling window focus:', error);
        }
    }

    async initializeExtensionIcons() {
        if (!chrome.action) return;

        try {
            // Update icon state for all open tabs
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                this.updateExtensionIcon(tab);
            }
        } catch (error) {
        }
    }

    updateExtensionIcon(tab) {
        if (!tab || !chrome.action) return;

        try {
            const isLinkedIn = this.isLinkedInUrl(tab.url);
            
            if (isLinkedIn) {
                // Enable extension on LinkedIn pages
                chrome.action.setTitle({
                    tabId: tab.id,
                    title: 'Xtrawrkx LinkedIn Extension - Click to open sidebar'
                });
                chrome.action.setBadgeText({
                    tabId: tab.id,
                    text: ''
                });
            } else {
                // Disable extension on non-LinkedIn pages
                chrome.action.setTitle({
                    tabId: tab.id,
                    title: 'Xtrawrkx Extension - Only works on LinkedIn pages'
                });
                chrome.action.setBadgeText({
                    tabId: tab.id,
                    text: '⚠'
                });
            }
        } catch (error) {
        }
    }

    async handleOpenSidePanelFallback(message, sender, sendResponse) {
        try {
            const tab = sender.tab;
            if (!tab) {
                sendResponse({ success: false, error: 'No sender tab found' });
                return;
            }

            if (chrome.sidePanel && chrome.sidePanel.open) {
                chrome.sidePanel.setOptions({
                    enabled: true,
                    path: 'src/sidebar/sidebar.html',
                    tabId: tab.id
                });

                chrome.sidePanel.open({ tabId: tab.id })
                    .then(() => sendResponse({ success: true }))
                    .catch((err) => sendResponse({ success: false, error: err.message }));
            } else {
                sendResponse({ success: false, error: 'SidePanel API not available' });
            }
        } catch (error) {
            sendResponse({ success: false, error: error.message || 'Failed to open sidePanel' });
        }
    }

    async checkAndCloseSidePanel(tab) {
        try {
            if (!tab || !tab.url) {
                // If no URL, disable sidePanel to be safe
                if (tab && tab.id) {
                    try {
                        await chrome.sidePanel.setOptions({
                            tabId: tab.id,
                            enabled: false
                        });
                    } catch (e) {
                        // Ignore errors
                    }
                }
                return;
            }

            // Check if current tab is LinkedIn
            const isLinkedIn = this.isLinkedInUrl(tab.url);

            if (!isLinkedIn) {
                // Tab is not LinkedIn, immediately disable and close sidePanel
                try {
                    // Disable sidePanel for non-LinkedIn tabs (this closes it)
                    await chrome.sidePanel.setOptions({
                        tabId: tab.id,
                        enabled: false
                    });
                    
                    // Send message to sidebar to close itself if it's open
                    try {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'CLOSE_SIDEPANEL',
                            reason: 'not_linkedin'
                        }).catch(() => {
                            // Ignore errors - sidebar might not be open or content script not loaded
                        });
                    } catch (msgError) {
                        // Ignore - content script might not be available
                    }
                    
                    // Update extension icon/badge to show it's disabled
                    if (chrome.action) {
                        chrome.action.setBadgeText({
                            tabId: tab.id,
                            text: '⚠'
                        });
                    }
                } catch (error) {
                }
            } else {
                // Tab is LinkedIn, ensure sidePanel is enabled
                try {
                    await chrome.sidePanel.setOptions({
                        tabId: tab.id,
                        enabled: true,
                        path: 'src/sidebar/sidebar.html'
                    });
                } catch (error) {
                }
            }
        } catch (error) {
            console.error('Error checking/closing sidePanel:', error);
        }
    }
}

// Initialize background service
try {
    const backgroundService = new BackgroundService();
} catch (error) {
    console.error('Failed to initialize background service:', error);
    // Even if initialization fails, try to handle basic messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'OPEN_SIDEPANEL_WITH_GESTURE') {
            const tab = sender.tab;
            if (tab && chrome.sidePanel && chrome.sidePanel.open) {
                try {
                    chrome.sidePanel.setOptions({
                        enabled: true,
                        path: 'src/sidebar/sidebar.html',
                        tabId: tab.id
                    });
                    chrome.sidePanel.open({ tabId: tab.id })
                        .then(() => sendResponse({ success: true }))
                        .catch((err) => sendResponse({ success: false, error: err.message }));
                    return true;
                } catch (err) {
                    sendResponse({ success: false, error: err.message });
                    return true;
                }
            }
            sendResponse({ success: false, error: 'SidePanel API not available' });
            return true;
        }
    });
}

