/**
 * XtraWrkx LinkedIn Extension Popup
 * Main popup interface for the extension
 */

class PopupController {
    constructor() {
        this.apiClient = null;
        this.currentPageData = null;
        this.isImporting = false;
        
        this.init();
    }

    async init() {
        // Load API client
        await this.loadApiClient();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check authentication status
        await this.checkAuthStatus();
        
        // Analyze current page
        await this.analyzeCurrentPage();
        
        // Load recent imports
        await this.loadRecentImports();
    }

    async loadApiClient() {
        // Import the API client (it's loaded globally)
        if (typeof ExtensionApiClient !== 'undefined') {
            this.apiClient = new ExtensionApiClient();
            await this.apiClient.init();
        } else {
            console.error('API Client not loaded');
        }
    }

    setupEventListeners() {
        // Authentication action
        document.getElementById('auth-action').addEventListener('click', () => {
            this.openOptions();
        });

        // Import buttons
        document.getElementById('import-current').addEventListener('click', () => {
            this.importCurrentPage();
        });

        document.getElementById('bulk-import').addEventListener('click', () => {
            this.showBulkImportOptions();
        });

        // Footer buttons
        document.getElementById('open-options').addEventListener('click', () => {
            this.openOptions();
        });

        document.getElementById('open-crm').addEventListener('click', () => {
            this.openCRM();
        });
    }

    async checkAuthStatus() {
        const authIndicator = document.getElementById('auth-indicator');
        const authMessage = document.getElementById('auth-message');
        const authAction = document.getElementById('auth-action');
        const mainContent = document.getElementById('main-content');

        try {
            if (!this.apiClient) {
                throw new Error('API client not initialized');
            }

            const isAuthenticated = await this.apiClient.verifyAuth();
            
            if (isAuthenticated) {
                authIndicator.className = 'indicator connected';
                authMessage.textContent = 'Connected to XtraWrkx';
                authAction.style.display = 'none';
                mainContent.style.display = 'block';
            } else {
                authIndicator.className = 'indicator error';
                authMessage.textContent = 'Not authenticated';
                authAction.style.display = 'inline-block';
                authAction.textContent = 'Sign In';
                mainContent.style.display = 'none';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            authIndicator.className = 'indicator warning';
            authMessage.textContent = 'Connection error';
            authAction.style.display = 'inline-block';
            authAction.textContent = 'Configure';
            mainContent.style.display = 'none';
        }
    }

    async analyzeCurrentPage() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('linkedin.com')) {
                this.showPageInfo('❌', 'Not LinkedIn', 'Please navigate to LinkedIn');
                this.disableImportButtons();
                return;
            }

            // Inject content script and get page data
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: this.extractPageData
            });

            if (results && results[0] && results[0].result) {
                this.currentPageData = results[0].result;
                this.updatePageInfo();
                this.enableImportButtons();
            } else {
                this.showPageInfo('⚠️', 'Unknown Page', 'Cannot extract data from this page');
                this.disableImportButtons();
            }
        } catch (error) {
            console.error('Page analysis failed:', error);
            this.showPageInfo('❌', 'Analysis Failed', 'Could not analyze page');
            this.disableImportButtons();
        }
    }

    // This function runs in the content script context
    extractPageData() {
        const url = window.location.href;
        const pathname = window.location.pathname;

        // Profile page — metadata only; full HTML capture runs from the sidebar
        if (pathname.includes('/in/') && !pathname.includes('/feed/')) {
            return {
                type: 'profile',
                data: {
                    profileUrl: url,
                    linkedInUrl: url,
                    pageTitle: document.title,
                }
            };
        }

        // Company page
        if (pathname.includes('/company/')) {
            return {
                type: 'company',
                data: {
                    name: document.querySelector('h1')?.textContent?.trim() || '',
                    industry: document.querySelector('.org-top-card-summary-info-list__info-item')?.textContent?.trim() || '',
                    website: document.querySelector('a[data-tracking-control-name="about_website"]')?.href || '',
                    about: document.querySelector('.break-words')?.textContent?.trim() || '',
                    companyUrl: url
                }
            };
        }

        // Search results
        if (pathname.includes('/search/')) {
            const searchType = url.includes('people') ? 'people' : 
                              url.includes('companies') ? 'companies' : 'mixed';
            
            return {
                type: 'search',
                searchType: searchType,
                data: {
                    resultsCount: document.querySelectorAll('.reusable-search__result-container').length
                }
            };
        }

        return null;
    }

    updatePageInfo() {
        if (!this.currentPageData) return;

        const pageIcon = document.getElementById('page-icon');
        const pageTitle = document.getElementById('page-title');
        const pageDescription = document.getElementById('page-description');

        switch (this.currentPageData.type) {
            case 'profile':
                pageIcon.textContent = '👤';
                pageTitle.textContent = 'LinkedIn Profile';
                pageDescription.textContent = `Ready to import: ${this.currentPageData.data.fullName || 'Profile'}`;
                break;
                
            case 'company':
                pageIcon.textContent = '🏢';
                pageTitle.textContent = 'Company Page';
                pageDescription.textContent = `Ready to import: ${this.currentPageData.data.name || 'Company'}`;
                break;
                
            case 'search':
                pageIcon.textContent = '🔍';
                pageTitle.textContent = 'Search Results';
                pageDescription.textContent = `${this.currentPageData.data.resultsCount} results found`;
                break;
                
            default:
                this.showPageInfo('❓', 'Unknown Page', 'Cannot determine page type');
        }
    }

    showPageInfo(icon, title, description) {
        document.getElementById('page-icon').textContent = icon;
        document.getElementById('page-title').textContent = title;
        document.getElementById('page-description').textContent = description;
    }

    enableImportButtons() {
        document.getElementById('import-current').disabled = false;
        
        // Enable bulk import only for search pages
        if (this.currentPageData?.type === 'search') {
            document.getElementById('bulk-import').disabled = false;
        }
    }

    disableImportButtons() {
        document.getElementById('import-current').disabled = true;
        document.getElementById('bulk-import').disabled = true;
    }

    async importCurrentPage() {
        if (this.isImporting || !this.currentPageData) return;

        this.isImporting = true;
        this.showImportStatus('loading', 'Importing...', 'Please wait while we import your data');

        try {
            // Send message to background script
            const response = await chrome.runtime.sendMessage({
                type: 'IMPORT_CURRENT_PAGE',
                data: this.currentPageData
            });

            if (response.success) {
                this.showImportStatus('success', 'Import Successful!', response.message || 'Data imported successfully');
                await this.loadRecentImports();
                
                // Auto-hide status after 3 seconds
                setTimeout(() => {
                    document.getElementById('import-status').style.display = 'none';
                }, 3000);
            } else {
                throw new Error(response.error || 'Import failed');
            }
        } catch (error) {
            console.error('Import failed:', error);
            this.showImportStatus('error', 'Import Failed', error.message);
        } finally {
            this.isImporting = false;
        }
    }

    showBulkImportOptions() {
        // For now, show a simple alert. In the future, this could open a modal
        // with options for bulk importing search results
        alert('Bulk import feature coming soon! This will allow you to import multiple profiles or companies from search results.');
    }

    showImportStatus(type, title, message) {
        const statusElement = document.getElementById('import-status');
        const statusIcon = document.getElementById('status-icon');
        const statusTitle = document.getElementById('status-title');
        const statusMessage = document.getElementById('status-message');
        const progressFill = document.getElementById('progress-fill');

        statusElement.style.display = 'block';
        statusIcon.className = `status-icon ${type}`;
        statusTitle.textContent = title;
        statusMessage.textContent = message;

        // Update icon content
        switch (type) {
            case 'loading':
                statusIcon.textContent = '⟳';
                progressFill.style.width = '100%';
                break;
            case 'success':
                statusIcon.textContent = '✓';
                progressFill.style.width = '100%';
                break;
            case 'error':
                statusIcon.textContent = '✗';
                progressFill.style.width = '0%';
                break;
        }
    }

    async loadRecentImports() {
        try {
            const recentImports = await chrome.storage.local.get(['recentImports']);
            const imports = recentImports.recentImports || [];

            if (imports.length > 0) {
                this.displayRecentImports(imports.slice(0, 3)); // Show last 3
            }
        } catch (error) {
            console.error('Failed to load recent imports:', error);
        }
    }

    displayRecentImports(imports) {
        const recentSection = document.getElementById('recent-imports');
        const recentList = document.getElementById('recent-list');

        if (imports.length === 0) {
            recentSection.style.display = 'none';
            return;
        }

        recentSection.style.display = 'block';
        recentList.innerHTML = '';

        imports.forEach(item => {
            const importElement = document.createElement('div');
            importElement.className = 'recent-item';
            
            importElement.innerHTML = `
                <div class="recent-item-info">
                    <h5>${item.name}</h5>
                    <p>${new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <div class="recent-item-status ${item.status}">${item.status}</div>
            `;
            
            recentList.appendChild(importElement);
        });
    }

    openOptions() {
        chrome.runtime.openOptionsPage();
    }

    async openCRM() {
        try {
            const config = await this.apiClient.getStoredConfig();
            const crmUrl = config.apiBaseUrl?.replace('/api', '') || 'http://localhost:3000';
            chrome.tabs.create({ url: crmUrl });
        } catch (error) {
            console.error('Failed to open CRM:', error);
            chrome.tabs.create({ url: 'http://localhost:3000' });
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});

// Load API client script
const script = document.createElement('script');
script.src = '../utils/api-client.js';
document.head.appendChild(script);





