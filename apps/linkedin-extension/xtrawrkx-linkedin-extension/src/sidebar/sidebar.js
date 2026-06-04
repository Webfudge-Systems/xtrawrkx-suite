/**
 * XtraWrkx LinkedIn Extension Sidebar Controller
 * Handles sidebar UI and communication with content script and background worker
 */

class SidebarController {
    constructor() {
        this.isAuthenticated = false;
        this.currentPageData = null;
        /** Last CRM snapshot from a successful Analyze (linkedin + enrichment + insights). */
        this.lastLinkedInSnapshot = null;
        /** Last profile HTML capture payload (preview mode or for copy). */
        this.lastCapturedHtmlPayload = null;
        /** Structured profile fields from last capture (DOM parse). */
        this.lastCapturedStructured = null;
        this.logger = typeof getLogger !== 'undefined' ? getLogger() : null;
        this.errorHandler = typeof getErrorHandler !== 'undefined' ? getErrorHandler() : null;
        this.init();
    }

    async init() {
        // Check if we're on LinkedIn - close if not
        const isLinkedIn = await this.checkLinkedInTab();
        if (!isLinkedIn) {
            this.closeSidePanel('not_linkedin');
            return;
        }

        // Check authentication status (with error handling)
        try {
            await this.checkAuthStatus();
        } catch (error) {
            console.error('Error checking auth status on init:', error);
            // Don't fail completely - just assume not authenticated
            this.isAuthenticated = false;
        }

        // Update UI based on auth status
        await this.updateUI();

        // Set up event listeners
        this.setupEventListeners();

        // Listen for messages from content script and background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            // Handle PAGE_DATA_FOR_SIDEBAR messages immediately
            if (message.type === 'PAGE_DATA_FOR_SIDEBAR') {
                const newUrl = message.url;
                const oldUrl = this.lastKnownUrl || this.currentPageData?.url;

                // URL changed — wipe all stale state immediately
                if (oldUrl && newUrl && oldUrl !== newUrl) {
                    this.currentExistingContact = null;
                    this.currentPageData = null;
                    this.lastLinkedInSnapshot = null;
                    this.lastCapturedHtmlPayload = null;
                    this.lastCapturedStructured = null;
                    this.hideHtmlCapturePanel();
                }

                this.lastKnownUrl = newUrl;

                const payload = message.data;
                this.currentPageData = {
                    type: payload?.type,
                    url: payload?.url || newUrl,
                    data: payload?.data,
                    timestamp: message.timestamp,
                };

                // ── Render new profile data IMMEDIATELY (no network wait) ──
                this._showImportView();
                this.updatePageDataUI();

                // ── Then check CRM in background and upgrade view if found ──
                const profileInner = payload?.data;
                const linkedInUrl = profileInner?.linkedInUrl || profileInner?.profileUrl;
                if (this.isAuthenticated && linkedInUrl) {
                    this.checkExistingContact(linkedInUrl)
                        .then((existingResult) => {
                            if (existingResult && existingResult.exists) {
                                this.showExistingLeadDetails(existingResult.contact, profileInner);
                            }
                        })
                        .catch(() => { /* keep import view on CRM error */ });
                }

                sendResponse({ success: true });
                return true;
            }
            
            // Handle other messages
            this.handleMessage(message, sender, sendResponse);
            return true;
        });

        // Listen for tab updates and URL changes
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            // Check on URL change or page complete
            if (changeInfo.url || changeInfo.status === 'complete') {
                this.checkAndCloseIfNotLinkedIn();
            }
        });

        // Monitor tab visibility to detect navigation
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab is hidden, check when it becomes visible again
                setTimeout(() => {
                    this.checkAndCloseIfNotLinkedIn();
                }, 100);
            } else {
                // Tab is visible, check immediately
                this.checkAndCloseIfNotLinkedIn();
            }
        });

        // Periodic check to ensure we're still on LinkedIn
        setInterval(() => {
            this.checkAndCloseIfNotLinkedIn();
        }, 2000); // Check every 2 seconds

        // Request current page data from content script
        this.requestPageData();

        // Force data extraction from content script
        setTimeout(() => {
            this.forceDataExtraction();
        }, 400);

        // Set up automatic data refresh
        this.setupAutoRefresh();
    }

    async checkLinkedInTab() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs && tabs.length > 0) {
                const tab = tabs[0];
                const isLinkedIn = tab.url && tab.url.includes('linkedin.com');

                if (!isLinkedIn) {
                    // Show message that extension only works on LinkedIn
                    this.showLinkedInOnlyMessage();
                    return false;
                }
                return true;
            }
        } catch (error) {
            console.error('Error checking LinkedIn tab:', error);
        }
        return true;
    }

    async checkAndCloseIfNotLinkedIn() {
        try {
            const isLinkedIn = await this.checkLinkedInTab();
            if (!isLinkedIn) {
                this.closeSidePanel('not_linkedin');
            }
        } catch (error) {
            console.error('Error checking LinkedIn status:', error);
        }
    }

    async closeSidePanel(reason = 'unknown') {
        
        try {
            // Try to close via sidePanel API
            if (chrome.sidePanel && chrome.sidePanel.close) {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs && tabs.length > 0) {
                    await chrome.sidePanel.close({ tabId: tabs[0].id });
                }
            }
        } catch (error) {
        }

        // Also try window.close as fallback
        try {
            if (window.close) {
                window.close();
            }
        } catch (error) {
        }
    }

    showLinkedInOnlyMessage() {
        const content = document.querySelector('.xtrawrkx-sidebar-content');
        if (!content) return;

        content.innerHTML = `
            <div class="xtrawrkx-linkedin-only-message">
                <div class="xtrawrkx-message-icon">
                    <i class="fab fa-linkedin"></i>
                </div>
                <h2>LinkedIn Required</h2>
                <p>This extension only works on LinkedIn pages.</p>
                <p class="xtrawrkx-message-hint">Navigate to LinkedIn to use the Xtrawrkx extension.</p>
            </div>
        `;
        
    }

    setupEventListeners() {
        // Logo button - redirect to CRM contacts page
        const logoBtn = document.getElementById('xtrawrkx-logo-btn');
        if (logoBtn) {
            logoBtn.addEventListener('click', async () => {
                const crmUrl = 'https://crm.xtrawrkx.com/sales/contacts';
                chrome.tabs.create({ url: crmUrl });
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('xtrawrkx-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                
                // Disable button and show loading state
                refreshBtn.disabled = true;
                refreshBtn.style.opacity = '0.6';
                refreshBtn.style.cursor = 'not-allowed';

                // Add rotation animation
                refreshBtn.style.transform = 'rotate(360deg)';
                refreshBtn.style.transition = 'transform 0.5s ease';

                try {
                    // Show loading animation
                    const loadingEl = document.getElementById('xtrawrkx-sidebar-loading');
                    const bodyEl = document.getElementById('xtrawrkx-sidebar-body');
                    const existingLeadEl = document.getElementById('xtrawrkx-existing-lead');
                    const loginForm = document.getElementById('xtrawrkx-login-form');
                    
                    // Hide all content and show loading
                    if (bodyEl) bodyEl.style.display = 'none';
                    if (existingLeadEl) existingLeadEl.style.display = 'none';
                    if (loginForm) loginForm.style.display = 'none';
                    if (loadingEl) {
                        loadingEl.style.display = 'flex';
                        // Update loading message
                        const loadingText = loadingEl.querySelector('p');
                        if (loadingText) {
                            loadingText.textContent = 'Refreshing data...';
                        }
                    }
                    
                    // Clear all cached data first
                    await this.clearCachedData();
                    
                    // Get current tab to ensure we're on LinkedIn
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (!tab || !tab.url || !tab.url.includes('linkedin.com')) {
                        this.showNotification('Please navigate to a LinkedIn page first', 'error');
                        if (loadingEl) loadingEl.style.display = 'none';
                        refreshBtn.disabled = false;
                        refreshBtn.style.opacity = '1';
                        refreshBtn.style.cursor = 'pointer';
                        refreshBtn.style.transform = '';
                        return;
                    }
                    
                    // Update last known URL
                    this.lastKnownUrl = tab.url;
                    
                    // Force fresh data extraction from content script
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'EXTRACT_CURRENT_PAGE'
                    }, async (response) => {
                        // Use outer scope loadingEl - don't redeclare
                        try {
                            if (chrome.runtime.lastError) {
                                console.error('❌ Error sending message to content script:', chrome.runtime.lastError);
                                this.showNotification('Failed to refresh data. Please try again.', 'error');
                                
                                // Hide loading on error
                                if (loadingEl) loadingEl.style.display = 'none';
                                
                                refreshBtn.disabled = false;
                                refreshBtn.style.opacity = '1';
                                refreshBtn.style.cursor = 'pointer';
                                refreshBtn.style.transform = '';
                                return;
                            }

                            if (response && response.success && response.data) {
                                
                                // Update loading message
                                if (loadingEl) {
                                    const loadingText = loadingEl.querySelector('p');
                                    if (loadingText) {
                                        loadingText.textContent = 'Processing data...';
                                    }
                                }
                                
                                // CRITICAL: Clear existing contact view first
                                this.currentExistingContact = null;
                                
                                // Clear any existing contact check interval
                                if (this.existingContactCheckInterval) {
                                    clearInterval(this.existingContactCheckInterval);
                                    this.existingContactCheckInterval = null;
                                }
                                
                                // Update current page data
                                this.currentPageData = response.data;
                                
                                // Update last known URL
                                if (response.data.url) {
                                    this.lastKnownUrl = response.data.url;
                                } else if (response.data.data?.linkedInUrl) {
                                    this.lastKnownUrl = response.data.data.linkedInUrl;
                                } else if (response.data.data?.profileUrl) {
                                    this.lastKnownUrl = response.data.data.profileUrl;
                                }
                                
                                
                                // FORCE hide existing lead view if visible
                                if (existingLeadEl) existingLeadEl.style.display = 'none';
                                
                                // FORCE show body element
                                if (bodyEl) bodyEl.style.display = 'block';
                                
                                // Hide login form
                                if (loginForm) loginForm.style.display = 'none';
                                
                                // Now check for existing contact if authenticated and update UI
                                if (this.isAuthenticated && response.data.data) {
                                    const linkedInUrl = response.data.data.linkedInUrl || response.data.data.profileUrl;
                                    if (linkedInUrl) {
                                        try {
                                            const result = await this.checkExistingContact(linkedInUrl);
                                            if (result && result.exists) {
                                                // Hide loading before showing existing contact
                                                if (loadingEl) loadingEl.style.display = 'none';
                                                this.showExistingLeadDetails(result.contact, response.data.data);
                                            } else {
                                                // Hide loading before updating UI
                                                if (loadingEl) loadingEl.style.display = 'none';
                                                this.updatePageDataUI();
                                            }
                                        } catch (error) {
                                            console.error('Error checking existing contact:', error);
                                            // Hide loading on error
                                            if (loadingEl) loadingEl.style.display = 'none';
                                            this.updatePageDataUI();
                                        }
                                    } else {
                                        // Hide loading before updating UI
                                        if (loadingEl) loadingEl.style.display = 'none';
                                        this.updatePageDataUI();
                                    }
                                } else {
                                    // Hide loading before updating UI
                                    if (loadingEl) loadingEl.style.display = 'none';
                                    this.updatePageDataUI();
                                }
                                
                                this.showNotification('Data refreshed successfully', 'success');
                            } else {
                                
                                // Hide loading on error
                                if (loadingEl) loadingEl.style.display = 'none';
                                
                                this.showNotification('No data available. Please ensure you are on a LinkedIn profile or company page.', 'error');
                            }
                        } catch (error) {
                            console.error('Error in refresh callback:', error);
                            // Hide loading on any error
                            if (loadingEl) loadingEl.style.display = 'none';
                            this.showNotification('Failed to refresh data. Please try again.', 'error');
                        } finally {
                            // Reset button state
                            refreshBtn.disabled = false;
                            refreshBtn.style.opacity = '1';
                            refreshBtn.style.cursor = 'pointer';
                            refreshBtn.style.transform = '';
                        }
                    });
                } catch (error) {
                    console.error('Error refreshing data:', error);
                    this.showNotification('Failed to refresh data. Please try again.', 'error');
                    refreshBtn.disabled = false;
                    refreshBtn.style.opacity = '1';
                    refreshBtn.style.cursor = 'pointer';
                    refreshBtn.style.transform = '';
                }
            });
        }

        // CRM button
        const crmBtn = document.getElementById('xtrawrkx-crm-btn');
        if (crmBtn) {
            crmBtn.addEventListener('click', async () => {
                // Navigate directly to the contacts list so the user sees imported leads
                const crmUrl = 'https://crm.xtrawrkx.com/sales/contacts';
                chrome.tabs.create({ url: crmUrl });
            });
        }

        // Close button
        const closeBtn = document.getElementById('xtrawrkx-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (chrome.sidePanel && chrome.sidePanel.close) {
                    chrome.sidePanel.close();
                } else {
                    window.close();
                }
            });
        }

        // Login form
        const loginForm = document.getElementById('xtrawrkx-auth-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Open CRM button
        const openCrmBtn = document.getElementById('xtrawrkx-open-crm');
        if (openCrmBtn) {
            openCrmBtn.addEventListener('click', () => {
                chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
            });
        }

        // Open CRM button (duplicate handler - remove if not needed)
        const openCrmButton = document.getElementById('xtrawrkx-open-crm');
        if (openCrmButton && !openCrmBtn) {
            openCrmButton.addEventListener('click', () => {
                chrome.tabs.create({ url: 'https://crm.xtrawrkx.com/sales/contacts' });
            });
        }

        // Primary action: profile → analyze HTML capture; company/search → CRM import
        const importBtn = document.getElementById('xtrawrkx-import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const pageType = this.currentPageData?.type;
                if (pageType === 'profile') {
                    this.handleAnalyzeProfile();
                } else {
                    this.handleImport();
                }
            });
        }

        // Quick Add to CRM (profile only — basic import without full HTML capture)
        const quickAddBtn = document.getElementById('xtrawrkx-quick-add-btn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.handleQuickAddToCrm());
        }

        const copyFullHtmlBtn = document.getElementById('xtrawrkx-copy-full-html');
        if (copyFullHtmlBtn) {
            copyFullHtmlBtn.addEventListener('click', () => {
                const html = this.lastCapturedHtmlPayload?.html;
                if (!html) {
                    this.showNotification('No captured HTML yet', 'error');
                    return;
                }
                navigator.clipboard.writeText(html).then(() => {
                    this.showNotification('Full HTML copied to clipboard', 'success');
                }).catch(() => {
                    this.showNotification('Could not copy HTML', 'error');
                });
            });
        }

        const copyStructuredBtn = document.getElementById('xtrawrkx-copy-structured-json');
        if (copyStructuredBtn) {
            copyStructuredBtn.addEventListener('click', () => {
                const structured = this.lastCapturedStructured;
                if (!structured) {
                    this.showNotification('No extracted JSON yet', 'error');
                    return;
                }
                navigator.clipboard.writeText(JSON.stringify(structured, null, 2)).then(() => {
                    this.showNotification('Extracted JSON copied to clipboard', 'success');
                }).catch(() => {
                    this.showNotification('Could not copy JSON', 'error');
                });
            });
        }

        const htmlCaptureCloseBtn = document.getElementById('xtrawrkx-html-capture-close');
        if (htmlCaptureCloseBtn) {
            htmlCaptureCloseBtn.addEventListener('click', () => this.hideHtmlCapturePanel());
        }

        document.querySelectorAll('.xtrawrkx-generate-pitch-trigger').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.handleGeneratePitch();
            });
        });

        const outreachClose = document.getElementById('xtrawrkx-outreach-close');
        const outreachModal = document.getElementById('xtrawrkx-outreach-modal');
        if (outreachClose && outreachModal) {
            outreachClose.addEventListener('click', () => this.hideOutreachModal());
            outreachModal.querySelector('.xtrawrkx-outreach-backdrop')?.addEventListener('click', () => {
                this.hideOutreachModal();
            });
        }

        document.querySelectorAll('.xtrawrkx-copy-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-copy-target');
                if (!targetId) return;
                const el = document.getElementById(targetId);
                if (!el || !el.value) return;
                navigator.clipboard.writeText(el.value).then(() => {
                    this.showNotification('Copied to clipboard', 'success');
                }).catch(() => {
                    this.showNotification('Could not copy', 'error');
                });
            });
        });

        // Share button
        const shareBtn = document.getElementById('xtrawrkx-share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                // Share functionality can be added here
            });
        }

        // View in CRM Button (for existing leads)
        const viewCrmBtn = document.getElementById('xtrawrkx-view-crm-btn');
        if (viewCrmBtn) {
            viewCrmBtn.addEventListener('click', () => {
                if (this.currentExistingContact && this.currentExistingContact.id) {
                    const crmUrl = `https://crm.xtrawrkx.com/sales/contacts/${this.currentExistingContact.id}`;
                    chrome.tabs.create({ url: crmUrl });
                } else {
                    chrome.tabs.create({ url: 'https://crm.xtrawrkx.com/sales/contacts' });
                }
            });
        }

        // Test Connection Button
        const testConnectionBtn = document.getElementById('xtrawrkx-test-connection');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', async () => {
                await this.testServerConnectivity();

                // Also test authentication endpoint specifically
                await this.testAuthEndpoint();
            });
        }
    }

    async checkExistingContact(linkedInUrl) {
        if (!linkedInUrl) return { success: false, exists: false };

        // Deduplicate: if the same URL is already being checked, reuse that promise
        if (this._crmCheckInFlight && this._crmCheckUrl === linkedInUrl) {
            return this._crmCheckInFlight;
        }

        this._crmCheckUrl = linkedInUrl;
        this._crmCheckInFlight = (async () => {
            try {
                const response = await chrome.runtime.sendMessage({
                    type: 'FIND_EXISTING_CONTACT',
                    linkedInUrl,
                });
                return response;
            } catch (error) {
                console.error('Error checking existing contact:', error);
                return { success: false, exists: false, error: error.message };
            } finally {
                // Clear only if this call is still the active one
                if (this._crmCheckUrl === linkedInUrl) {
                    this._crmCheckInFlight = null;
                    this._crmCheckUrl = null;
                }
            }
        })();

        return this._crmCheckInFlight;
    }

    showExistingLeadDetails(contact, profileData) {
        this.hideHtmlCapturePanel();

        // Store the LinkedIn URL for this contact to detect changes
        const linkedInUrl = profileData?.linkedInUrl || profileData?.profileUrl || this.currentPageData?.data?.linkedInUrl || this.currentPageData?.data?.profileUrl;
        const currentTabUrl = this.currentPageData?.url;
        
        // Use current tab URL if available (more reliable), otherwise use LinkedIn URL from profile
        if (currentTabUrl) {
            this.lastKnownUrl = currentTabUrl;
        } else if (linkedInUrl) {
            this.lastKnownUrl = linkedInUrl;
        }

        // Store current existing contact for CRM link
        this.currentExistingContact = contact;

        const crmSnapshot =
            contact?.linkedinProfileData ?? contact?.attributes?.linkedinProfileData;
        if (crmSnapshot && typeof crmSnapshot === 'object' && Object.keys(crmSnapshot).length > 0) {
            this.lastLinkedInSnapshot = crmSnapshot;
        }
        
        // Set up a periodic check to detect URL changes even when showing existing contact
        // Clear any existing interval first
        if (this.existingContactCheckInterval) {
            clearInterval(this.existingContactCheckInterval);
        }
        
        // Check every 1.5 seconds if URL has changed
        this.existingContactCheckInterval = setInterval(async () => {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.url && tab.url.includes('linkedin.com')) {
                    const currentUrl = tab.url;
                    if (this.lastKnownUrl && currentUrl !== this.lastKnownUrl) {
                        
                        // Clear the interval
                        clearInterval(this.existingContactCheckInterval);
                        this.existingContactCheckInterval = null;
                        
                        // Clear existing contact
                        this.currentExistingContact = null;
                        this.currentPageData = null;
                        this.lastLinkedInSnapshot = null;
                        this.lastKnownUrl = currentUrl;
                        
                        // Request fresh data
                        await this.requestPageData();
                    }
                }
            } catch (error) {
                console.error('Error in existing contact URL check:', error);
            }
        }, 1500);

        // Hide other UI elements
        const loginForm = document.getElementById('xtrawrkx-login-form');
        const loadingEl = document.getElementById('xtrawrkx-sidebar-loading');
        const bodyEl = document.getElementById('xtrawrkx-sidebar-body');
        const existingLeadEl = document.getElementById('xtrawrkx-existing-lead');

        if (loginForm) loginForm.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'none';
        if (bodyEl) bodyEl.style.display = 'none';
        if (existingLeadEl) existingLeadEl.style.display = 'block';

        // Setup tab functionality
        this.setupExistingLeadTabs();

        // Update existing lead details
        this.updateExistingLeadUI(contact, profileData);
    }

    updateExistingLeadUI(contact, profileData) {

        // Update profile image
        const existingImage = document.getElementById('xtrawrkx-existing-image');
        if (existingImage && profileData.profilePhoto) {
            existingImage.innerHTML = `<img src="${profileData.profilePhoto}" alt="${contact.firstName} ${contact.lastName}" />`;
        }

        // Update header name and title
        const existingName = document.getElementById('xtrawrkx-existing-name');
        if (existingName) {
            existingName.textContent = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown Name';
        }

        const existingTitle = document.getElementById('xtrawrkx-existing-title');
        if (existingTitle) {
            const title = profileData.currentJobTitle || contact.title || profileData.headline || 'No title available';
            existingTitle.textContent = title;
        }

        // Update full name in details section
        const existingFullName = document.getElementById('xtrawrkx-existing-full-name');
        if (existingFullName) {
            existingFullName.textContent = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || '-';
        }

        // Update company
        const existingCompany = document.getElementById('xtrawrkx-existing-company');
        if (existingCompany) {
            let companyName = '-';
            if (contact.leadCompany && contact.leadCompany.companyName) {
                companyName = contact.leadCompany.companyName;
            } else if (profileData.currentCompany) {
                companyName = profileData.currentCompany;
            }
            existingCompany.textContent = companyName;
        }

        // Update job title in details
        const existingJobTitle = document.getElementById('xtrawrkx-existing-job-title');
        if (existingJobTitle) {
            const jobTitle = profileData.currentJobTitle || contact.title || profileData.headline || '-';
            existingJobTitle.textContent = jobTitle;
        }

        // Update contact type
        const existingContactType = document.getElementById('xtrawrkx-existing-contact-type');
        if (existingContactType) {
            existingContactType.textContent = contact.contactType || 'Potential Customer';
        }

        // Update owner
        const existingOwner = document.getElementById('xtrawrkx-existing-owner');
        if (existingOwner) {
            let ownerName = '-';
            if (contact.assignedTo) {
                ownerName = `${contact.assignedTo.firstName || ''} ${contact.assignedTo.lastName || ''}`.trim() || 'Assigned User';
            }
            existingOwner.textContent = ownerName;
        }

        // Update email (placeholder for now)
        const existingEmail = document.getElementById('xtrawrkx-existing-email');
        if (existingEmail) {
            if (contact.email && !contact.email.includes('@xtrawrkx.placeholder')) {
                existingEmail.textContent = contact.email;
                existingEmail.classList.remove('xtrawrkx-email-placeholder');
            } else {

                existingEmail.textContent = 'Add Email';
                existingEmail.classList.add('xtrawrkx-email-placeholder');
            }
        }

        // Update phone (placeholder for now)
        const existingPhone = document.getElementById('xtrawrkx-existing-phone');
        if (existingPhone) {
            if (contact.phone) {
                existingPhone.textContent = contact.phone;
                existingPhone.classList.remove('xtrawrkx-phone-placeholder');
            } else {
                existingPhone.textContent = 'Add Phone';
                existingPhone.classList.add('xtrawrkx-phone-placeholder');
            }
        }

        // Update website (placeholder for now)
        const existingWebsite = document.getElementById('xtrawrkx-existing-website');
        if (existingWebsite) {
            if (contact.website) {
                existingWebsite.textContent = contact.website;
                existingWebsite.classList.remove('xtrawrkx-website-placeholder');
            } else {
                existingWebsite.textContent = 'Add Website';
                existingWebsite.classList.add('xtrawrkx-website-placeholder');
            }
        }

        // Update description
        const existingDescription = document.getElementById('xtrawrkx-existing-description');
        if (existingDescription) {
            // Prioritize contact description, then profile description/about
            const description = contact.description || profileData.description || profileData.about || '';
            if (description && description.trim()) {
                existingDescription.textContent = description.trim();
                existingDescription.classList.remove('xtrawrkx-description-empty');
            } else {
                existingDescription.textContent = 'No description available';
                existingDescription.classList.add('xtrawrkx-description-empty');
            }
        }
    }

    setupExistingLeadTabs() {

        // Get tab buttons
        const detailsTab = document.getElementById('xtrawrkx-details-tab');
        const relatedTab = document.getElementById('xtrawrkx-related-tab');
        const companyTab = document.getElementById('xtrawrkx-company-tab');
        const chatsTab = document.getElementById('xtrawrkx-chats-tab');

        // Get tab content
        const detailsContent = document.getElementById('xtrawrkx-details-content');
        const relatedContent = document.getElementById('xtrawrkx-related-content');
        const companyContent = document.getElementById('xtrawrkx-company-content');
        const chatsContent = document.getElementById('xtrawrkx-chats-content');

        if (!detailsTab || !relatedTab || !companyTab || !chatsTab ||
            !detailsContent || !relatedContent || !companyContent || !chatsContent) {
            console.error('❌ Tab elements not found');
            return;
        }

        // Remove existing event listeners by cloning
        const newDetailsTab = detailsTab.cloneNode(true);
        const newRelatedTab = relatedTab.cloneNode(true);
        const newCompanyTab = companyTab.cloneNode(true);
        const newChatsTab = chatsTab.cloneNode(true);

        detailsTab.parentNode.replaceChild(newDetailsTab, detailsTab);
        relatedTab.parentNode.replaceChild(newRelatedTab, relatedTab);
        companyTab.parentNode.replaceChild(newCompanyTab, companyTab);
        chatsTab.parentNode.replaceChild(newChatsTab, chatsTab);

        // Add click handlers
        newDetailsTab.addEventListener('click', () => {
            this.switchExistingLeadTab('details');
        });

        newRelatedTab.addEventListener('click', () => {
            this.switchExistingLeadTab('related');
        });

        newCompanyTab.addEventListener('click', () => {
            this.switchExistingLeadTab('company');
        });

        newChatsTab.addEventListener('click', () => {
            this.switchExistingLeadTab('chats');
        });

        // Setup expand/collapse for related sections
        this.setupRelatedSectionToggles();

    }

    switchExistingLeadTab(tabName) {

        // Update tab buttons
        const detailsTab = document.getElementById('xtrawrkx-details-tab');
        const relatedTab = document.getElementById('xtrawrkx-related-tab');
        const companyTab = document.getElementById('xtrawrkx-company-tab');
        const chatsTab = document.getElementById('xtrawrkx-chats-tab');

        if (detailsTab && relatedTab && companyTab && chatsTab) {
            // Remove active from all tabs
            [detailsTab, relatedTab, companyTab, chatsTab].forEach(tab => {
                tab.classList.remove('active');
            });

            // Add active to selected tab
            const activeTab = document.getElementById(`xtrawrkx-${tabName}-tab`);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        }

        // Update tab content
        const detailsContent = document.getElementById('xtrawrkx-details-content');
        const relatedContent = document.getElementById('xtrawrkx-related-content');
        const companyContent = document.getElementById('xtrawrkx-company-content');
        const chatsContent = document.getElementById('xtrawrkx-chats-content');

        if (detailsContent && relatedContent && companyContent && chatsContent) {
            // Remove active from all content
            [detailsContent, relatedContent, companyContent, chatsContent].forEach(content => {
                content.classList.remove('active');
            });

            // Add active to selected content
            const activeContent = document.getElementById(`xtrawrkx-${tabName}-content`);
            if (activeContent) {
                activeContent.classList.add('active');
            }

            // Load data based on tab
            if (tabName === 'related') {
                this.loadRelatedData();
            } else if (tabName === 'company') {
                this.loadCompanyData();
            } else if (tabName === 'chats') {
                this.loadChatsData();
            }
        }
    }

    setupRelatedSectionToggles() {
        const relatedSections = document.querySelectorAll('.xtrawrkx-related-section');

        relatedSections.forEach(section => {
            const header = section.querySelector('.xtrawrkx-related-header');
            const content = section.querySelector('.xtrawrkx-related-content-area');
            const expandBtn = section.querySelector('.xtrawrkx-expand-btn');

            if (header && content && expandBtn) {
                header.addEventListener('click', (e) => {
                    // Don't toggle if clicking on add button
                    if (e.target.closest('.xtrawrkx-add-btn')) {
                        return;
                    }

                    const isExpanded = content.classList.contains('expanded');

                    if (isExpanded) {
                        content.classList.remove('expanded');
                        expandBtn.style.transform = 'rotate(0deg)';
                    } else {
                        content.classList.add('expanded');
                        expandBtn.style.transform = 'rotate(180deg)';
                    }
                });
            }
        });
    }

    async loadRelatedData() {

        if (!this.currentExistingContact || !this.currentExistingContact.id) {
            return;
        }


        try {
            // Show loading state
            this.showRelatedDataLoading(true);

            // Fetch related data from CRM
            const response = await chrome.runtime.sendMessage({
                type: 'GET_CONTACT_RELATED_DATA',
                contactId: this.currentExistingContact.id
            });

            if (response && response.success) {
                this.displayRelatedData(response.data);
            } else {
                console.error('❌ Failed to load related data:', response?.error);
                this.showRelatedDataError();
            }

        } catch (error) {
            console.error('❌ Error loading related data:', error);
            this.showRelatedDataError();
        } finally {
            this.showRelatedDataLoading(false);
        }
    }

    showRelatedDataLoading(isLoading) {
        const sections = document.querySelectorAll('.xtrawrkx-related-content-area');
        sections.forEach(section => {
            if (isLoading) {
                section.innerHTML = '<div class="xtrawrkx-loading-state">Loading...</div>';
            }
        });
    }

    showRelatedDataError() {
        const sections = document.querySelectorAll('.xtrawrkx-related-content-area');
        sections.forEach(section => {
            section.innerHTML = '<div class="xtrawrkx-error-state">Failed to load data</div>';
        });
    }

    displayRelatedData(data) {

        // Calculate and display stats
        this.displayStats(data.deals);

        // Display each section
        this.displayDeals(data.deals);
        this.displayTasks(data.tasks);
        this.displayFiles(data.files);
        this.displayActivities(data.activities);

        // Update section counts
        this.updateRelatedSectionCounts({
            deals: data.deals.length,
            tasks: data.tasks.length,
            files: data.files.length,
            calendarEvents: data.activities.length
        });
    }

    displayStats(deals) {
        const totalWon = document.getElementById('xtrawrkx-total-won');
        const winRate = document.getElementById('xtrawrkx-win-rate');

        // Calculate total won from closed deals
        let totalWonAmount = 0;
        let totalDeals = deals.length;
        let wonDeals = 0;

        deals.forEach(deal => {
            // Check for various "won" status variations
            const status = (deal.status || '').toUpperCase();
            if (status === 'WON' || status === 'CLOSED_WON' || status === 'CLOSED-WON' || status === 'COMPLETED') {
                // Use deal.value, deal.amount, or deal.dealValue
                const dealValue = deal.value || deal.amount || deal.dealValue || 0;
                totalWonAmount += dealValue;
                wonDeals++;
            }
        });

        // Calculate win rate
        const winRatePercentage = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

        if (totalWon) {
            totalWon.textContent = `₹${totalWonAmount.toLocaleString()}`;
        }
        if (winRate) {
            winRate.textContent = `${winRatePercentage}%`;
        }
    }

    displayDeals(deals) {
        const pipelineContent = document.getElementById('xtrawrkx-pipeline-content');
        if (!pipelineContent) return;

        if (deals.length === 0) {
            pipelineContent.innerHTML = '<div class="xtrawrkx-empty-state">No pipeline records found</div>';
            return;
        }

        const dealsHtml = deals.map(deal => `
            <div class="xtrawrkx-related-item">
                <div class="xtrawrkx-item-header">
                    <h4 class="xtrawrkx-item-title">${deal.name || 'Untitled Deal'}</h4>
                    <span class="xtrawrkx-item-status xtrawrkx-status-${(deal.status || '').toLowerCase()}">${deal.status || 'Unknown'}</span>
                </div>
                <div class="xtrawrkx-item-details">
                    <span class="xtrawrkx-item-value">₹${(deal.value || 0).toLocaleString()}</span>
                    <span class="xtrawrkx-item-date">${this.formatDate(deal.closeDate || deal.createdAt)}</span>
                </div>
            </div>
        `).join('');

        pipelineContent.innerHTML = dealsHtml;
    }

    displayTasks(tasks) {
        const tasksContent = document.getElementById('xtrawrkx-tasks-content');
        if (!tasksContent) return;

        if (tasks.length === 0) {
            tasksContent.innerHTML = '<div class="xtrawrkx-empty-state">No tasks found</div>';
            return;
        }

        const tasksHtml = tasks.map(task => `
            <div class="xtrawrkx-related-item">
                <div class="xtrawrkx-item-header">
                    <h4 class="xtrawrkx-item-title">${task.title || 'Untitled Task'}</h4>
                    <span class="xtrawrkx-item-status xtrawrkx-status-${(task.status || '').toLowerCase()}">${task.status || 'Unknown'}</span>
                </div>
                <div class="xtrawrkx-item-details">
                    <span class="xtrawrkx-item-priority">Priority: ${task.priority || 'Medium'}</span>
                    <span class="xtrawrkx-item-date">${this.formatDate(task.dueDate || task.createdAt)}</span>
                </div>
                ${task.progress ? `<div class="xtrawrkx-progress-bar"><div class="xtrawrkx-progress-fill" style="width: ${task.progress}%"></div></div>` : ''}
            </div>
        `).join('');

        tasksContent.innerHTML = tasksHtml;
    }

    displayFiles(files) {
        const filesContent = document.getElementById('xtrawrkx-files-content');
        if (!filesContent) return;

        if (files.length === 0) {
            filesContent.innerHTML = '<div class="xtrawrkx-empty-state">No files found</div>';
            return;
        }

        const filesHtml = files.map(file => `
            <div class="xtrawrkx-related-item">
                <div class="xtrawrkx-item-header">
                    <h4 class="xtrawrkx-item-title">${file.originalName || file.name || 'Untitled File'}</h4>
                    <span class="xtrawrkx-item-size">${this.formatFileSize(file.size)}</span>
                </div>
                <div class="xtrawrkx-item-details">
                    <span class="xtrawrkx-item-type">${file.mimeType || 'Unknown type'}</span>
                    <span class="xtrawrkx-item-date">${this.formatDate(file.createdAt)}</span>
                </div>
            </div>
        `).join('');

        filesContent.innerHTML = filesHtml;
    }

    displayActivities(activities) {
        const calendarContent = document.getElementById('xtrawrkx-calendar-content');
        if (!calendarContent) return;

        if (activities.length === 0) {
            calendarContent.innerHTML = '<div class="xtrawrkx-empty-state">No calendar events found</div>';
            return;
        }

        const activitiesHtml = activities.map(activity => `
            <div class="xtrawrkx-related-item">
                <div class="xtrawrkx-item-header">
                    <h4 class="xtrawrkx-item-title">${activity.title || 'Untitled Event'}</h4>
                    <span class="xtrawrkx-item-type xtrawrkx-activity-${(activity.activityType || '').toLowerCase()}">${activity.activityType || 'Event'}</span>
                </div>
                <div class="xtrawrkx-item-details">
                    <span class="xtrawrkx-item-status">${activity.status || 'Scheduled'}</span>
                    <span class="xtrawrkx-item-date">${this.formatDate(activity.scheduledDate || activity.createdAt)}</span>
                </div>
            </div>
        `).join('');

        calendarContent.innerHTML = activitiesHtml;
    }

    formatDate(dateString) {
        if (!dateString) return 'No date';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    formatFileSize(bytes) {
        if (!bytes) return '0 B';

        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    updateRelatedSectionCounts(counts) {
        const sections = [
            { selector: '.xtrawrkx-related-section:nth-child(2) .xtrawrkx-related-title', key: 'deals', label: 'Deals' },
            { selector: '.xtrawrkx-related-section:nth-child(3) .xtrawrkx-related-title', key: 'tasks', label: 'Tasks' },
            { selector: '.xtrawrkx-related-section:nth-child(4) .xtrawrkx-related-title', key: 'files', label: 'Files' },
            { selector: '.xtrawrkx-related-section:nth-child(5) .xtrawrkx-related-title', key: 'calendarEvents', label: 'Calendar Events' }
        ];

        sections.forEach(section => {
            const element = document.querySelector(section.selector);
            if (element) {
                const count = counts[section.key] || 0;
                element.textContent = `${section.label} (${count})`;
            }
        });
    }

    async loadCompanyData() {

        if (!this.currentExistingContact) {
            this.showCompanyDataError();
            return;
        }

        // Show loading state
        this.showCompanyDataLoading();

        try {
            // Get company data from contact's account, clientAccount, or leadCompany
            let companyData = null;


            // Priority order: clientAccount > account > leadCompany
            if (this.currentExistingContact.clientAccount) {
                // Active client - fetch client account data (highest priority)
                const response = await chrome.runtime.sendMessage({
                    type: 'GET_COMPANY_DATA',
                    companyId: this.currentExistingContact.clientAccount.id,
                    companyType: 'client'
                });
                if (response && response.success) {
                    companyData = response.data;
                }
            } else if (this.currentExistingContact.account) {
                // Active client - fetch account data (legacy)
                const response = await chrome.runtime.sendMessage({
                    type: 'GET_COMPANY_DATA',
                    companyId: this.currentExistingContact.account.id,
                    companyType: 'client'
                });
                if (response && response.success) {
                    companyData = response.data;
                }
            } else if (this.currentExistingContact.leadCompany) {
                // Lead - but check if it has been converted to client account

                // First try to fetch as lead company
                let leadResponse = await chrome.runtime.sendMessage({
                    type: 'GET_COMPANY_DATA',
                    companyId: this.currentExistingContact.leadCompany.id,
                    companyType: 'lead'
                });

                if (leadResponse && leadResponse.success && leadResponse.data) {
                    companyData = leadResponse.data;

                    // Check if this lead has been converted to a client account
                    if (leadResponse.data.convertedAccount && leadResponse.data.convertedAccount.id) {

                        // Fetch the client account data instead
                        const clientResponse = await chrome.runtime.sendMessage({
                            type: 'GET_COMPANY_DATA',
                            companyId: leadResponse.data.convertedAccount.id,
                            companyType: 'client'
                        });

                        if (clientResponse && clientResponse.success && clientResponse.data) {
                            companyData = clientResponse.data;
                        }
                    }
                } else {
                }
            } else {

                // Last resort: try to find company by name from LinkedIn profile data
                let companyNameToSearch = null;
                
                // Try multiple sources for company name
                if (this.currentPageData) {
                    companyNameToSearch = this.currentPageData.currentCompany || 
                                         (this.currentPageData.data && this.currentPageData.data.currentCompany) ||
                                         (this.currentPageData.data && this.currentPageData.data.allExperiences && 
                                          this.currentPageData.data.allExperiences[0] && 
                                          this.currentPageData.data.allExperiences[0].company);
                }

                if (companyNameToSearch) {

                    // Search in lead companies first, then client accounts
                    const companySearchResponse = await chrome.runtime.sendMessage({
                        type: 'SEARCH_COMPANY_BY_NAME',
                        companyName: companyNameToSearch
                    });

                    if (companySearchResponse && companySearchResponse.success && companySearchResponse.data) {
                        companyData = companySearchResponse.data;
                    } else {
                    }
                } else {
                }
            }

            if (companyData) {
                this.displayCompanyData(companyData);
            } else {
                this.showCompanyDataError();
            }

        } catch (error) {
            console.error('❌ Error loading company data:', error);
            this.showCompanyDataError();
        }
    }

    displayCompanyData(company) {

        // Determine if this is a client or lead
        // Priority: explicit type marking > specific fields > fallback logic
        let isClient = false;
        let isLead = false;

        if (company._companyType === 'client') {
            isClient = true;
        } else if (company._companyType === 'lead') {
            isLead = true;
        } else {
            // Fallback detection based on fields
            // Client indicators: accountManager, revenue, conversionDate, type field
            isClient = !!(company.accountManager || company.revenue || company.conversionDate || company.type);
            // Lead indicators: segment, assignedTo, dealValue, status (lead-specific)
            isLead = !!(company.segment || (company.assignedTo && !company.accountManager) ||
                (company.status && ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION'].includes(company.status)));
        }

        // If both or neither are detected, prioritize client if we have client-like fields
        if (isClient && isLead) {
            isLead = false; // Client takes priority
        } else if (!isClient && !isLead) {
            // Default fallback - check if we have any client-specific fields
            isClient = !!(company.accountManager || company.revenue || company.type);
            isLead = !isClient;
        }


        // Update company name and status
        const companyName = document.getElementById('xtrawrkx-company-name');
        const companyStatus = document.getElementById('xtrawrkx-company-status');

        if (companyName) {
            companyName.textContent = company.companyName || 'Unknown Company';
        }

        if (companyStatus) {
            const statusText = isClient ? 'Active Client' : 'Lead';
            companyStatus.textContent = statusText;
            companyStatus.className = `xtrawrkx-company-status-badge ${isClient ? 'active-client' : 'lead'}`;
        }

        // Build location string from city, state, country
        const locationParts = [company.city, company.state, company.country].filter(Boolean);
        const location = locationParts.length > 0 ? locationParts.join(', ') : null;

        // Update common company details - only show fields that exist in schema and have values
        // Based on lead-company and client-account schemas, these are the valid common fields
        const commonFields = [
            {
                id: 'xtrawrkx-company-industry',
                value: company.industry,
                rowId: null, // Always show (required field in both schemas)
                showIf: true,
                schemaField: 'industry' // Exists in both schemas
            },
            {
                id: 'xtrawrkx-company-website',
                value: company.website,
                rowId: null,
                showIf: company.website && company.website.trim() !== '' && company.website !== '-',
                schemaField: 'website' // Exists in both schemas
            },
            {
                id: 'xtrawrkx-company-employees',
                value: company.employees,
                rowId: null,
                showIf: company.employees && company.employees.trim() !== '' && company.employees !== '-',
                schemaField: 'employees' // Exists in both schemas
            },
            {
                id: 'xtrawrkx-company-founded',
                value: company.founded,
                rowId: null,
                showIf: company.founded && company.founded.trim() !== '' && company.founded !== '-',
                schemaField: 'founded' // Exists in both schemas
            },
            {
                id: 'xtrawrkx-company-location',
                value: location,
                rowId: null,
                showIf: location && location !== '-',
                schemaField: 'city/state/country' // Derived from city, state, country (exist in both schemas)
            },
            {
                id: 'xtrawrkx-company-health-score',
                value: company.healthScore !== null && company.healthScore !== undefined ? `${company.healthScore}/100` : null,
                rowId: null,
                showIf: company.healthScore !== null && company.healthScore !== undefined && company.healthScore !== '',
                schemaField: 'healthScore' // Exists in both schemas
            },
            {
                id: 'xtrawrkx-company-last-contact',
                value: this.formatDate(company.lastContactDate || company.lastActivityDate || company.lastActivity),
                rowId: null,
                showIf: company.lastContactDate || company.lastActivityDate || company.lastActivity,
                schemaField: 'lastContactDate/lastActivityDate/lastActivity' // lastContactDate in lead schema, lastActivityDate/lastActivity in client schema
            }
        ];

        // Only display fields that exist in the schema and have values
        commonFields.forEach(field => {
            const element = document.getElementById(field.id);
            const rowElement = field.rowId ? document.getElementById(field.rowId) : element?.closest('.xtrawrkx-company-row');

            if (element && rowElement) {
                // Check if field has a value and is not empty/null/undefined
                const hasValue = field.value !== null && 
                                 field.value !== undefined && 
                                 field.value !== '' && 
                                 field.value !== '-' && 
                                 field.value !== 'N/A';
                
                if (field.showIf && hasValue) {
                    // Special handling for website - make it a clickable link
                    if (field.id === 'xtrawrkx-company-website' && field.value) {
                        let websiteUrl = field.value;
                        // Add protocol if missing
                        if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
                            websiteUrl = 'https://' + websiteUrl;
                        }
                        element.innerHTML = `<a href="${this.escapeHtml(websiteUrl)}" target="_blank" rel="noopener noreferrer" class="xtrawrkx-link">${this.escapeHtml(field.value)}</a>`;
                    } else {
                        element.textContent = field.value;
                    }
                    rowElement.style.display = 'block';
                } else {
                    // Hide row if field doesn't exist in schema or has no value
                    rowElement.style.display = 'none';
                }
            }
        });

        // Show/hide and populate type-specific fields
        this.toggleCompanyTypeFields(isClient, isLead);

        if (isClient) {
            this.populateClientFields(company);
        } else if (isLead) {
            this.populateLeadFields(company);
        }

        // Display other contacts
        this.displayCompanyContacts(company.contacts || []);
    }

    toggleCompanyTypeFields(isClient, isLead) {
        // Hide all type-specific fields first - they will be shown individually if they have values
        const leadFields = document.querySelectorAll('.xtrawrkx-lead-only');
        const clientFields = document.querySelectorAll('.xtrawrkx-client-only');

        leadFields.forEach(field => field.style.display = 'none');
        clientFields.forEach(field => field.style.display = 'none');

        // Note: Individual fields will be shown/hidden in populateClientFields and populateLeadFields
        // based on whether they have values
    }

    populateClientFields(company) {
        // Client-specific fields from client-account schema: type, revenue, conversionDate
        const clientFields = [
            {
                id: 'xtrawrkx-company-client-type',
                value: company.type,
                rowId: 'xtrawrkx-client-type-row',
                showIf: company.type !== null && company.type !== undefined && company.type !== '',
                schemaField: 'type' // Exists in client-account schema only
            },
            {
                id: 'xtrawrkx-company-revenue',
                value: company.revenue ? `₹${Number(company.revenue).toLocaleString()}` : null,
                rowId: 'xtrawrkx-revenue-row',
                showIf: company.revenue !== null && company.revenue !== undefined && Number(company.revenue) > 0,
                schemaField: 'revenue' // Exists in client-account schema only
            },
            {
                id: 'xtrawrkx-company-conversion-date',
                value: this.formatDate(company.conversionDate),
                rowId: 'xtrawrkx-conversion-date-row',
                showIf: company.conversionDate !== null && company.conversionDate !== undefined && company.conversionDate !== '',
                schemaField: 'conversionDate' // Exists in client-account schema only
            }
        ];

        clientFields.forEach(field => {
            const element = document.getElementById(field.id);
            const rowElement = document.getElementById(field.rowId);

            if (element && rowElement) {
                // Only show if field exists in schema and has a valid value
                const hasValue = field.value !== null && 
                                 field.value !== undefined && 
                                 field.value !== '' && 
                                 field.value !== '-' && 
                                 field.value !== 'N/A';
                
                if (field.showIf && hasValue) {
                    element.textContent = field.value;
                    rowElement.style.display = 'block';
                } else {
                    // Hide row if field doesn't exist in schema or has no value
                    rowElement.style.display = 'none';
                }
            }
        });
    }

    populateLeadFields(company) {
        // Lead-specific fields from lead-company schema: segment, status, dealValue
        const leadFields = [
            {
                id: 'xtrawrkx-company-segment',
                value: company.segment,
                rowId: 'xtrawrkx-lead-segment-row',
                showIf: company.segment !== null && company.segment !== undefined && company.segment !== '',
                schemaField: 'segment' // Exists in lead-company schema only
            },
            {
                id: 'xtrawrkx-company-lead-status',
                value: company.status,
                rowId: 'xtrawrkx-lead-status-row',
                showIf: company.status !== null && company.status !== undefined && company.status !== '',
                schemaField: 'status' // Exists in lead-company schema only (lead-specific enum values)
            },
            {
                id: 'xtrawrkx-company-deal-value',
                value: company.dealValue ? `₹${Number(company.dealValue).toLocaleString()}` : null,
                rowId: 'xtrawrkx-deal-value-row',
                showIf: company.dealValue !== null && company.dealValue !== undefined && Number(company.dealValue) > 0,
                schemaField: 'dealValue' // Exists in lead-company schema only
            }
        ];

        leadFields.forEach(field => {
            const element = document.getElementById(field.id);
            const rowElement = document.getElementById(field.rowId);

            if (element && rowElement) {
                // Only show if field exists in schema and has a valid value
                const hasValue = field.value !== null && 
                                 field.value !== undefined && 
                                 field.value !== '' && 
                                 field.value !== '-' && 
                                 field.value !== 'N/A';
                
                if (field.showIf && hasValue) {
                    element.textContent = field.value;
                    rowElement.style.display = 'block';
                } else {
                    // Hide row if field doesn't exist in schema or has no value
                    rowElement.style.display = 'none';
                }
            }
        });
    }

    displayCompanyContacts(contacts) {
        const contactsContent = document.getElementById('xtrawrkx-company-contacts-content');
        if (!contactsContent) return;

        // Filter out current contact
        const otherContacts = contacts.filter(contact =>
            contact.id !== this.currentExistingContact.id
        );

        if (otherContacts.length === 0) {
            contactsContent.innerHTML = '<div class="xtrawrkx-empty-state">No other contacts found</div>';
            return;
        }

        const contactsHtml = otherContacts.map(contact => `
            <div class="xtrawrkx-related-item">
                <div class="xtrawrkx-item-header">
                    <h4 class="xtrawrkx-item-title">${contact.firstName} ${contact.lastName}</h4>
                    <span class="xtrawrkx-item-status">${contact.status || 'Active'}</span>
                </div>
                <div class="xtrawrkx-item-details">
                    <span class="xtrawrkx-item-type">${contact.title || 'No title'}</span>
                    <span class="xtrawrkx-item-date">${contact.email || 'No email'}</span>
                </div>
            </div>
        `).join('');

        contactsContent.innerHTML = contactsHtml;

        // Update count
        const titleElement = document.querySelector('.xtrawrkx-related-section:last-child .xtrawrkx-related-title');
        if (titleElement) {
            titleElement.textContent = `Other Contacts (${otherContacts.length})`;
        }
    }

    showCompanyDataLoading() {
        const companyName = document.getElementById('xtrawrkx-company-name');
        const companyStatus = document.getElementById('xtrawrkx-company-status');
        const companyDetails = document.querySelector('.xtrawrkx-company-details');

        if (companyName) {
            companyName.textContent = 'Loading company data...';
        }
        
        if (companyStatus) {
            companyStatus.textContent = '-';
            companyStatus.className = 'xtrawrkx-company-status-badge';
        }

        // Hide all company detail rows while loading
        if (companyDetails) {
            const rows = companyDetails.querySelectorAll('.xtrawrkx-company-row');
            rows.forEach(row => {
                row.style.display = 'none';
            });
        }
    }

    showCompanyDataError() {
        const companyName = document.getElementById('xtrawrkx-company-name');
        const companyStatus = document.getElementById('xtrawrkx-company-status');
        const companyDetails = document.querySelector('.xtrawrkx-company-details');
        const contactsContent = document.getElementById('xtrawrkx-company-contacts-content');

        if (companyName) {
            companyName.textContent = 'Company data unavailable';
        }
        
        if (companyStatus) {
            companyStatus.textContent = '-';
            companyStatus.className = 'xtrawrkx-company-status-badge';
        }

        // Hide all company detail rows
        if (companyDetails) {
            const rows = companyDetails.querySelectorAll('.xtrawrkx-company-row');
            rows.forEach(row => {
                row.style.display = 'none';
            });
        }

        if (contactsContent) {
            contactsContent.innerHTML = '<div class="xtrawrkx-empty-state">No company data available</div>';
        }
    }

    async loadChatsData() {

        if (!this.currentExistingContact || !this.currentExistingContact.id) {
            return;
        }

        try {
            // Fetch chat data from related data (already loaded)
            const response = await chrome.runtime.sendMessage({
                type: 'GET_CONTACT_RELATED_DATA',
                contactId: this.currentExistingContact.id
            });

            if (response && response.success && response.data.chats) {
                this.displayChats(response.data.chats);
            } else {
                this.showChatsError();
            }

        } catch (error) {
            console.error('❌ Error loading chats data:', error);
            this.showChatsError();
        }
    }

    displayChats(chats) {
        const chatsList = document.getElementById('xtrawrkx-chats-list');
        if (!chatsList) return;

        if (chats.length === 0) {
            chatsList.innerHTML = '<div class="xtrawrkx-empty-state">No chat messages found</div>';
            return;
        }

        const chatsHtml = chats.map(chat => `
            <div class="xtrawrkx-chat-message ${chat.isOutgoing ? 'outgoing' : 'incoming'}">
                <div class="xtrawrkx-chat-header">
                    <span class="xtrawrkx-chat-sender">${chat.senderName || (chat.isOutgoing ? 'You' : 'Contact')}</span>
                    <span class="xtrawrkx-chat-time">${this.formatDate(chat.createdAt)}</span>
                </div>
                <div class="xtrawrkx-chat-content">${chat.message || chat.content || 'No message content'}</div>
            </div>
        `).join('');

        chatsList.innerHTML = chatsHtml;
    }

    showChatsError() {
        const chatsList = document.getElementById('xtrawrkx-chats-list');
        if (chatsList) {
            chatsList.innerHTML = '<div class="xtrawrkx-error-state">Failed to load chat messages</div>';
        }
    }

    async testServerConnectivity() {
        try {

            // Hardcode production URL
            const baseURL = 'https://xtrawrkxsuits-production.up.railway.app';

            if (this.logger) {
                this.logger.log('Testing connection to:', baseURL);
            }

            // Test basic connectivity
            const response = await fetch(`${baseURL}/api/auth/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });


            if (response.ok) {
            } else {
            }

        } catch (error) {
            console.error('❌ Server connectivity test failed:', error);
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
        }
    }

    async testAuthEndpoint() {
        try {

            // Hardcode production URL
            const baseURL = 'https://xtrawrkxsuits-production.up.railway.app';

            if (this.logger) {
                this.logger.log('Testing auth endpoint:', `${baseURL}/api/auth/internal/login`);
            }

            // Test with invalid credentials to see if endpoint exists
            const response = await fetch(`${baseURL}/api/auth/internal/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'test@test.com',
                    password: 'invalid'
                })
            });


            const responseText = await response.text();

            if (response.status === 400 || response.status === 401) {
            } else if (response.status === 404) {
            } else {
            }

        } catch (error) {
            console.error('❌ Auth endpoint test failed:', error);
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
        }
    }

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

    async handleLogin() {
        const emailInput = document.getElementById('xtrawrkx-login-email');
        const passwordInput = document.getElementById('xtrawrkx-login-password');
        const submitBtn = document.getElementById('xtrawrkx-login-submit');
        const errorDiv = document.getElementById('xtrawrkx-login-error');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            this.showLoginError('Please enter both email and password');
            return;
        }

        // Save original button HTML
        const originalHTML = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span>Signing in...</span>
            <div class="btn-icon">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        `;

        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'AUTHENTICATE',
                email,
                password
            });


            if (!response) {
                throw new Error('No response from authentication service');
            }

            if (response.success) {
                this.isAuthenticated = true;
                passwordInput.value = '';

                // Show success message
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                }

                await this.updateUI();

                // Show temporary success notification
                this.showSuccessMessage('Successfully signed in!');
            } else {
                const errorMsg = response.error || 'Authentication failed';
                console.error('Login failed:', errorMsg);
                this.showLoginError(errorMsg);
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMsg = error.message || 'Unable to connect to authentication service. Please try again.';
            this.showLoginError(errorMsg);
        } finally {
            submitBtn.disabled = originalDisabled;
            submitBtn.innerHTML = originalHTML;
        }
    }

    showSuccessMessage(message) {
        const errorDiv = document.getElementById('xtrawrkx-login-error');
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.style.background = 'rgba(16, 185, 129, 0.1)';
            errorDiv.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            errorDiv.style.color = '#059669';
            errorDiv.textContent = message;

            // Reset to error styling after 3 seconds
            setTimeout(() => {
                if (errorDiv) {
                    errorDiv.style.background = 'rgba(239, 68, 68, 0.1)';
                    errorDiv.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                    errorDiv.style.color = '#dc2626';
                }
            }, 3000);
        }
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('xtrawrkx-login-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    /** Show the import/body panel immediately (no network calls). */
    _showImportView() {
        const loginForm = document.getElementById('xtrawrkx-login-form');
        const loadingEl = document.getElementById('xtrawrkx-sidebar-loading');
        const bodyEl = document.getElementById('xtrawrkx-sidebar-body');
        const existingLeadEl = document.getElementById('xtrawrkx-existing-lead');
        if (loginForm) loginForm.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'none';
        if (existingLeadEl) existingLeadEl.style.display = 'none';
        if (bodyEl) bodyEl.style.display = 'block';
    }

    async updateUI() {
        const loginForm = document.getElementById('xtrawrkx-login-form');
        const loadingEl = document.getElementById('xtrawrkx-sidebar-loading');
        const bodyEl = document.getElementById('xtrawrkx-sidebar-body');
        const existingLeadEl = document.getElementById('xtrawrkx-existing-lead');

        // Not authenticated → show login
        if (!this.isAuthenticated) {
            if (loginForm) loginForm.style.display = 'block';
            if (loadingEl) loadingEl.style.display = 'none';
            if (bodyEl) bodyEl.style.display = 'none';
            if (existingLeadEl) existingLeadEl.style.display = 'none';
            this.testServerConnectivity();
            return;
        }

        // No data yet → show spinner
        if (!this.currentPageData) {
            if (loginForm) loginForm.style.display = 'none';
            if (loadingEl) loadingEl.style.display = 'flex';
            if (bodyEl) bodyEl.style.display = 'none';
            return;
        }

        // ── Render import view immediately ──
        this._showImportView();
        this.updatePageDataUI();

        // ── Then check CRM in background ──
        const linkedInUrl = this.currentPageData.data?.linkedInUrl || this.currentPageData.data?.profileUrl;
        if (linkedInUrl) {
            this.checkExistingContact(linkedInUrl)
                .then((result) => {
                    if (result && result.exists) {
                        this.showExistingLeadDetails(result.contact, this.currentPageData.data);
                    }
                })
                .catch(() => { /* keep import view on error */ });
        }
    }

    updatePageDataUI() {

        if (!this.currentPageData || !this.currentPageData.data) {
            return;
        }

        const data = this.currentPageData.data;

        const importBtn = document.getElementById('xtrawrkx-import-btn');
        const pitchSidebarBtns = document.querySelectorAll('.xtrawrkx-generate-pitch-sidebar');
        pitchSidebarBtns.forEach((b) => {
            b.style.display = 'none';
        });

        const quickAddBtn = document.getElementById('xtrawrkx-quick-add-btn');

        if (this.currentPageData.type === 'profile') {
            if (quickAddBtn) quickAddBtn.style.display = 'inline-flex';
            const displayName = data.pageTitle || data.name || data.fullName || 'LinkedIn profile';

            // Update profile name (page title when DOM fields are not scraped)
            const profileName = document.getElementById('xtrawrkx-profile-name');
            if (profileName) {
                profileName.textContent = displayName;
            }

            const compatibilityScoreEl = document.getElementById('xtrawrkx-compatibility-score');
            if (compatibilityScoreEl) compatibilityScoreEl.style.display = 'none';

            // Update profile image - use new profilePhoto field
            const profileImage = document.getElementById('xtrawrkx-profile-image');
            if (profileImage) {
                if (data.profilePhoto) {
                    profileImage.innerHTML = `<img src="${this.escapeHtml(data.profilePhoto)}" alt="${this.escapeHtml(displayName)}" />`;
                } else if (data.profileImage) {
                    profileImage.innerHTML = `<img src="${this.escapeHtml(data.profileImage)}" alt="${this.escapeHtml(displayName)}" />`;
                } else {
                    const nameForAvatar = displayName || 'U';
                    profileImage.innerHTML = `<div class="default-avatar">${nameForAvatar.charAt(0).toUpperCase()}</div>`;
                }
            }

            // Update job title — prefer actual experience title, fall back to headline
            const jobTitleItem = document.getElementById('xtrawrkx-job-title-item');
            const jobTitleValue = document.getElementById('xtrawrkx-job-title');
            const jobTitleLabel = document.getElementById('xtrawrkx-job-title-label');

            // Source priority: experience[0].title → currentJobTitle → jobTitle → headline
            const expTitle =
                (Array.isArray(data.experience) && data.experience.length > 0)
                    ? (data.experience[0].title || '')
                    : '';
            const hasRealTitle = !!(expTitle || data.currentJobTitle || data.jobTitle);
            let jobTitleDisplay = expTitle || data.currentJobTitle || data.jobTitle || '';

            // Only use headline as last resort and label it differently
            if (!jobTitleDisplay && data.headline) {
                // Extract first meaningful segment from pipe-separated LinkedIn headline
                const firstSegment = data.headline.split('|')[0].trim();
                jobTitleDisplay = firstSegment || data.headline;
            }

            if (jobTitleDisplay) {
                if (jobTitleItem) jobTitleItem.style.display = 'flex';
                if (jobTitleValue) jobTitleValue.textContent = this.escapeHtml(jobTitleDisplay);
                // Show correct label
                if (jobTitleLabel) {
                    jobTitleLabel.textContent = hasRealTitle ? 'Job Title' : 'Headline';
                }
            } else {
                if (jobTitleItem) jobTitleItem.style.display = 'none';
            }

            // Update LinkedIn URL
            const linkedinItem = document.getElementById('xtrawrkx-linkedin-item');
            const linkedinUrl = document.getElementById('xtrawrkx-linkedin-url');
            if (data.linkedInUrl || data.profileUrl) {
                const url = data.linkedInUrl || data.profileUrl;
                if (linkedinItem) linkedinItem.style.display = 'flex';
                if (linkedinUrl) {
                    linkedinUrl.href = url;
                    linkedinUrl.textContent = url;
                }
            } else {
                if (linkedinItem) linkedinItem.style.display = 'none';
            }

            // Update description - prioritize description field, then about
            const descriptionItem = document.getElementById('xtrawrkx-description-item');
            const descriptionValue = document.getElementById('xtrawrkx-description');
            const description = data.description || data.about || data.summary;
            if (description) {
                if (descriptionItem) descriptionItem.style.display = 'flex';
                if (descriptionValue) {
                    // Truncate long descriptions
                    const truncatedDesc = description.length > 200 ?
                        description.substring(0, 200) + '...' : description;
                    descriptionValue.textContent = this.escapeHtml(truncatedDesc);
                }
            } else {
                if (descriptionItem) descriptionItem.style.display = 'none';
            }

            // Show current company from latest experience if available
            const companySection = document.getElementById('xtrawrkx-company-section');
            const companyName = document.getElementById('xtrawrkx-profile-company-name');


            if (!companySection) {
                console.error('❌ Company section element not found!');
            }
            if (!companyName) {
                console.error('❌ Company name element not found!');
            }

            // Try multiple sources for company name
            let companyToDisplay = null;

            // Priority 1: currentCompany from extracted data
            if (data.currentCompany && data.currentCompany.trim() && data.currentCompany.trim() !== '-') {
                companyToDisplay = data.currentCompany;
            }
            // Priority 2: From first experience (current/most recent)
            else if (data.allExperiences && data.allExperiences.length > 0) {
                const firstExp = data.allExperiences[0];
                if (firstExp) {
                    companyToDisplay = firstExp.company || firstExp.companyName || null;
                    if (companyToDisplay && companyToDisplay.trim() && companyToDisplay.trim() !== '-') {
                    } else {
                        companyToDisplay = null;
                    }
                }
            }
            // Priority 3: From selected experience
            if (!companyToDisplay && data.selectedExperience && data.selectedExperience.company) {
                companyToDisplay = data.selectedExperience.company;
            }
            // Priority 4: From headline if it contains company info
            if (!companyToDisplay && data.headline && data.headline.includes(' at ')) {
                const headlineParts = data.headline.split(' at ');
                if (headlineParts.length > 1) {
                    companyToDisplay = headlineParts[headlineParts.length - 1].trim();
                }
            }

            if (companyToDisplay && companyToDisplay.trim() && companyToDisplay.trim() !== '-') {
                if (companySection) {
                    companySection.style.display = 'block';
                }
                if (companyName) {
                    companyName.textContent = this.escapeHtml(companyToDisplay.trim());
                }
            } else {
                if (companySection) {
                    companySection.style.display = 'none';
                }
            }

            // Show experience selection if multiple experiences are available
            this.updateExperienceSelection(data.allExperiences);

            if (importBtn) {
                importBtn.innerHTML = '<span>Analyze Profile</span>';
            }
            pitchSidebarBtns.forEach((b) => {
                b.style.display = 'flex';
            });
        } else if (this.currentPageData.type === 'company') {
            if (quickAddBtn) quickAddBtn.style.display = 'none';
            // For companies, show company name in profile
            const profileName = document.getElementById('xtrawrkx-profile-name');
            if (profileName) {
                profileName.textContent = data.name || data.companyName || 'Company';
            }

            // Hide profile-specific fields
            const jobTitleItem = document.getElementById('xtrawrkx-job-title-item');
            const linkedinItem = document.getElementById('xtrawrkx-linkedin-item');
            const descriptionItem = document.getElementById('xtrawrkx-description-item');
            if (jobTitleItem) jobTitleItem.style.display = 'none';
            if (linkedinItem) linkedinItem.style.display = 'none';
            if (descriptionItem) descriptionItem.style.display = 'none';

            // Show company section
            const companySection = document.getElementById('xtrawrkx-company-section');
            const companyName = document.getElementById('xtrawrkx-company-name');
            if (companySection) companySection.style.display = 'block';
            if (companyName) {
                companyName.textContent = this.escapeHtml(data.name || data.companyName || 'N/A');
            }

            // Update import button
            if (importBtn) {
                importBtn.innerHTML = '<span>Add to CRM</span>';
            }
        }
    }

    updateExperienceSelection(allExperiences) {

        const experienceSection = document.getElementById('xtrawrkx-experience-section');
        const experienceList = document.getElementById('xtrawrkx-experience-list');
        const experienceDivider = document.getElementById('xtrawrkx-experience-divider');

        if (!allExperiences || allExperiences.length === 0) {

            // Hide experience selection if no experiences or only one experience
            if (experienceSection) experienceSection.style.display = 'none';
            if (experienceDivider) experienceDivider.style.display = 'none';
            return;
        }


        // Show experience selection section
        if (experienceSection) experienceSection.style.display = 'block';
        if (experienceDivider) experienceDivider.style.display = 'block';

        if (!experienceList) return;

        // Clear existing experience items
        experienceList.innerHTML = '';

        // Create experience items
        allExperiences.forEach((experience, index) => {
            const experienceItem = document.createElement('div');
            experienceItem.className = 'xtrawrkx-experience-item';
            experienceItem.dataset.experienceIndex = index;

            // Mark first experience as selected by default
            if (index === 0) {
                experienceItem.classList.add('selected');
                this.selectedExperienceIndex = 0;
            }

            experienceItem.innerHTML = `
                <div class="xtrawrkx-experience-content">
                    ${experience.companyLogo ?
                    `<div class="xtrawrkx-experience-logo">
                            <img src="${this.escapeHtml(experience.companyLogo)}" alt="${this.escapeHtml(experience.company || 'Company')} logo" />
                        </div>` :
                    `<div class="xtrawrkx-experience-logo-placeholder">
                            <div class="xtrawrkx-company-initial">${(experience.company || 'C').charAt(0).toUpperCase()}</div>
                        </div>`
                }
                    <div class="xtrawrkx-experience-info">
                        <div class="xtrawrkx-experience-title">
                            ${this.escapeHtml(experience.jobTitle || 'Job Title Not Available')}
                            ${experience.isCurrent ? '<span class="xtrawrkx-experience-current">CURRENT</span>' : ''}
                        </div>
                        <div class="xtrawrkx-experience-company">
                            ${this.escapeHtml(experience.company || 'Company Not Available')}
                        </div>
                    </div>
                </div>
            `;

            // Add click handler
            experienceItem.addEventListener('click', () => {
                this.selectExperience(index, allExperiences);
            });

            experienceList.appendChild(experienceItem);
        });

        
    }

    selectExperience(index, allExperiences) {
        // Remove selection from all items
        const allItems = document.querySelectorAll('.xtrawrkx-experience-item');
        allItems.forEach(item => item.classList.remove('selected'));

        // Add selection to clicked item
        const selectedItem = document.querySelector(`[data-experience-index="${index}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        // Store selected experience
        this.selectedExperienceIndex = index;
        this.selectedExperience = allExperiences[index];


        // Update the profile display with selected experience
        this.updateProfileWithSelectedExperience(this.selectedExperience);
    }

    updateProfileWithSelectedExperience(experience) {
        // Update job title
        const jobTitleValue = document.getElementById('xtrawrkx-job-title');
        const jobTitleItem = document.getElementById('xtrawrkx-job-title-item');
        if (experience.jobTitle) {
            if (jobTitleValue) jobTitleValue.textContent = this.escapeHtml(experience.jobTitle);
            if (jobTitleItem) jobTitleItem.style.display = 'flex';
        } else {
            if (jobTitleItem) jobTitleItem.style.display = 'none';
        }

        // Update company
        const companyName = document.getElementById('xtrawrkx-company-name');
        const companySection = document.getElementById('xtrawrkx-company-section');
        if (experience.company) {
            if (companyName) companyName.textContent = this.escapeHtml(experience.company);
            if (companySection) companySection.style.display = 'block';
        } else {
            if (companySection) companySection.style.display = 'none';
        }

    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    sendTabMessage(tabId, message) {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(response);
            });
        });
    }

    isProfileHtmlPreviewOnly() {
        return typeof window !== 'undefined' && window.XTR_WRKX_PROFILE_HTML_PREVIEW_ONLY === true;
    }

    hideHtmlCapturePanel() {
        const panel = document.getElementById('xtrawrkx-html-capture-panel');
        const divider = document.getElementById('xtrawrkx-html-capture-divider');
        if (panel) panel.style.display = 'none';
        if (divider) divider.style.display = 'none';
    }

    /**
     * Resolve structured profile JSON from capture payload (content script parse or sidebar fallback).
     * @param {{ html?: string, title?: string, structured?: object }} payload
     */
    resolveStructuredProfile(payload) {
        if (payload?.structured && typeof payload.structured === 'object') {
            return payload.structured;
        }
        if (
            typeof ProfileStructuredParser !== 'undefined' &&
            typeof payload?.html === 'string'
        ) {
            return ProfileStructuredParser.parseFromHtml(payload.html, {
                title: payload.title,
            });
        }
        return null;
    }

    /**
     * Show captured document HTML in the sidebar (Phase 1 — no Strapi/AI).
     * @param {{ url: string, html: string, title?: string, capturedAt?: string, structured?: object }} payload
     */
    showHtmlCapturePanel(payload) {
        const { url, html, title, capturedAt } = payload || {};
        const structured = this.resolveStructuredProfile(payload);
        this.lastCapturedStructured = structured;

        const panel = document.getElementById('xtrawrkx-html-capture-panel');
        const divider = document.getElementById('xtrawrkx-html-capture-divider');
        const metaEl = document.getElementById('xtrawrkx-html-capture-meta');
        const preEl = document.getElementById('xtrawrkx-html-capture-pre');
        const jsonPreEl = document.getElementById('xtrawrkx-structured-json-pre');
        if (!panel || !metaEl || !preEl || typeof html !== 'string') {
            return;
        }

        const chars = html.length;
        let utf8Bytes = chars;
        try {
            utf8Bytes = new TextEncoder().encode(html).length;
        } catch {
            /* ignore */
        }

        const maxChars =
            typeof window !== 'undefined' && Number(window.XTR_WRKX_HTML_PREVIEW_MAX_CHARS) > 0
                ? Number(window.XTR_WRKX_HTML_PREVIEW_MAX_CHARS)
                : 15000;

        const truncated = html.length > maxChars;
        const slice = truncated ? html.slice(0, maxChars) : html;

        const metaLines = [
            `Title: ${title || '—'}`,
            `URL: ${url || '—'}`,
            `Captured (ISO): ${capturedAt || '—'}`,
            `Length: ${chars.toLocaleString()} characters • ~${utf8Bytes.toLocaleString()} UTF-8 bytes`,
        ];
        if (truncated) {
            metaLines.push(
                `Preview: first ${maxChars.toLocaleString()} characters only (use Copy for full HTML).`,
            );
        }
        if (structured) {
            const filled = [
                structured.name,
                structured.headline,
                structured.location,
                structured.about,
                structured.followers,
                structured.connections,
            ].filter(Boolean).length;
            const lists =
                (structured.experience?.length || 0) +
                (structured.education?.length || 0) +
                (structured.skills?.length || 0);
            metaLines.push(
                `DOM extract: ${filled}/6 scalar fields, ${lists} list items (experience + education + skills).`,
            );
        }
        metaEl.innerHTML = this.escapeHtml(metaLines.join('\n')).replace(/\n/g, '<br>');

        if (jsonPreEl) {
            jsonPreEl.textContent = structured
                ? JSON.stringify(structured, null, 2)
                : 'Could not parse structured profile from captured HTML.';
        }

        preEl.textContent = slice + (truncated ? '\n\n… [truncated for display]' : '');

        if (divider) divider.style.display = 'block';
        panel.style.display = 'block';
    }

    async handleAnalyzeProfile() {
        if (!this.isAuthenticated) {
            this.showNotification('Please sign in first', 'error');
            return;
        }

        const importBtn = document.getElementById('xtrawrkx-import-btn');
        const loadingEl = document.getElementById('xtrawrkx-sidebar-loading');
        const bodyEl = document.getElementById('xtrawrkx-sidebar-body');
        const previewOnly = this.isProfileHtmlPreviewOnly();

        this.hideHtmlCapturePanel();

        if (importBtn) {
            importBtn.disabled = true;
            importBtn.innerHTML = '<span>Working…</span>';
        }
        if (loadingEl) {
            loadingEl.style.display = 'flex';
            const titleEl = loadingEl.querySelector('h3');
            const msgEl = loadingEl.querySelector('p');
            if (titleEl) {
                titleEl.textContent = previewOnly ? 'Capturing page' : 'Analyzing profile';
            }
            if (msgEl) {
                msgEl.textContent = previewOnly
                    ? 'Scrolling to load lazy content, then reading full document HTML…'
                    : 'Scrolling the page, capturing HTML, and sending to Xtrawrkx…';
            }
        }
        if (bodyEl) bodyEl.style.display = 'none';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id || !tab.url?.includes('linkedin.com')) {
                throw new Error('Open a LinkedIn profile tab first.');
            }

            const captureResponse = await this.sendTabMessage(tab.id, { type: 'CAPTURE_PROFILE_HTML' });
            if (!captureResponse?.success || !captureResponse.payload) {
                throw new Error(captureResponse?.error || 'Could not capture page HTML');
            }

            const payload = captureResponse.payload;
            this.lastCapturedHtmlPayload = payload;

            if (previewOnly) {
                this.showNotification(
                    'HTML captured (preview). CRM / AI sync is off — see profileCaptureMode.js to enable.',
                    'success',
                );
                this.showHtmlCapturePanel(payload);
            } else {
                const apiResponse = await chrome.runtime.sendMessage({
                    type: 'SUBMIT_PROFILE_HTML_CAPTURE',
                    payload,
                });

                if (!apiResponse?.success) {
                    throw new Error(apiResponse?.error || 'Server rejected the capture');
                }

                const syncMeta = apiResponse.data?.meta;
                const syncMsg =
                    syncMeta?.created === false
                        ? 'LinkedIn profile updated in CRM.'
                        : 'LinkedIn profile saved to CRM.';
                this.showNotification(syncMsg, 'success');

                const wrapped = apiResponse.data;
                const entity = wrapped?.data;
                const snapshot =
                    entity?.linkedinProfileData ?? entity?.attributes?.linkedinProfileData;
                if (snapshot && typeof snapshot === 'object') {
                    this.lastLinkedInSnapshot = snapshot;
                }

                if (entity?.id) {
                    this.currentExistingContact = entity;
                    setTimeout(() => {
                        this.showExistingLeadDetails(entity, this.currentPageData?.data || {});
                    }, 150);
                }
            }
        } catch (error) {
            console.error('handleAnalyzeProfile:', error);
            this.showNotification(error.message || 'Analysis failed', 'error');
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
            if (bodyEl) bodyEl.style.display = 'block';
            if (importBtn) {
                importBtn.disabled = false;
                importBtn.innerHTML = '<span>Analyze Profile</span>';
            }
        }
    }

    buildMinimalOutreachPayload() {
        const d = this.currentPageData?.data || {};
        return {
            linkedin: {
                name: d.pageTitle || d.name || d.fullName || '',
                headline: d.headline || d.currentJobTitle || d.jobTitle || '',
                location: d.location || '',
                about: d.description || d.about || d.summary || '',
            },
            insights: {
                persona: d.persona || '',
                industry: d.industry || '',
                potential_needs: Array.isArray(d.potential_needs) ? d.potential_needs : [],
            },
            enrichment: {},
        };
    }

    showOutreachModal(variants) {
        const setTa = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.value = text || '';
        };
        setTa('xtrawrkx-outreach-dm', variants.shortDm);
        setTa('xtrawrkx-outreach-pitch', variants.personalizedPitch);
        setTa('xtrawrkx-outreach-sales', variants.salesMessage);
        const m = document.getElementById('xtrawrkx-outreach-modal');
        if (m) {
            m.style.display = 'flex';
            m.setAttribute('aria-hidden', 'false');
        }
    }

    hideOutreachModal() {
        const m = document.getElementById('xtrawrkx-outreach-modal');
        if (m) {
            m.style.display = 'none';
            m.setAttribute('aria-hidden', 'true');
        }
    }

    async handleGeneratePitch() {
        if (!this.isAuthenticated) {
            this.showNotification('Please sign in first', 'error');
            return;
        }
        if (this.currentPageData?.type !== 'profile') {
            this.showNotification('Open a LinkedIn profile to generate pitches.', 'error');
            return;
        }

        const payload = this.lastLinkedInSnapshot
            ? { linkedinProfileData: this.lastLinkedInSnapshot }
            : this.buildMinimalOutreachPayload();

        const pitchBtns = document.querySelectorAll('.xtrawrkx-generate-pitch-trigger');
        pitchBtns.forEach((pitchBtn) => {
            pitchBtn.disabled = true;
            const sp = pitchBtn.querySelector('span');
            if (sp) sp.textContent = 'Generating…';
        });

        try {
            const apiResponse = await chrome.runtime.sendMessage({
                type: 'GENERATE_LINKEDIN_OUTREACH',
                payload,
            });
            if (!apiResponse?.success) {
                throw new Error(apiResponse?.error || 'Generation failed');
            }
            const variants = apiResponse.data;
            if (!variants || (!variants.shortDm && !variants.personalizedPitch && !variants.salesMessage)) {
                throw new Error('Empty response from server');
            }
            this.showOutreachModal(variants);
        } catch (e) {
            console.error('handleGeneratePitch:', e);
            this.showNotification(e.message || 'Could not generate pitches', 'error');
        } finally {
            pitchBtns.forEach((pitchBtn) => {
                pitchBtn.disabled = false;
                const sp = pitchBtn.querySelector('span');
                if (sp) sp.textContent = 'Generate Pitch';
            });
        }
    }

    async handleImport() {
        if (!this.currentPageData) {
            this.showNotification('No data available to import', 'error');
            return;
        }

        if (this.currentPageData.type === 'profile') {
            await this.handleAnalyzeProfile();
            return;
        }

        const dataToImport = { ...this.currentPageData };

        const importBtn = document.getElementById('xtrawrkx-import-btn');

        if (importBtn) {
            const originalText = importBtn.innerHTML;
            importBtn.disabled = true;
            importBtn.innerHTML = '<span>Adding...</span>';
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'IMPORT_CURRENT_PAGE',
                data: dataToImport
            });

            if (response && response.success) {
                // Show success message with details
                let successMessage = 'Successfully imported to Xtrawrkx!';
                if (response.data && response.data.leadCompany) {
                    successMessage = `Contact and Company created successfully!`;
                } else if (response.data) {
                    successMessage = 'Contact created successfully!';
                }

                this.showNotification(successMessage, 'success');

                if (importBtn) {
                    importBtn.disabled = false;
                    importBtn.innerHTML = '<span>Added to CRM</span>';
                    importBtn.style.background = '#10b981';

                    setTimeout(() => {
                        importBtn.innerHTML = '<span>Add to CRM</span>';
                        importBtn.style.background = '#6366f1';
                    }, 3000);
                }
            } else {
                throw new Error(response?.error || 'Import failed');
            }
        } catch (error) {
            console.error('Import failed:', error);
            this.showNotification(`Import failed: ${error.message}`, 'error');

            if (importBtn) {
                importBtn.disabled = false;
                importBtn.innerHTML = '<span>Add to CRM</span>';
            }
        }
    }

    async handleQuickAddToCrm() {
        if (!this.isAuthenticated) {
            this.showNotification('Please sign in first', 'error');
            return;
        }
        if (!this.currentPageData) {
            this.showNotification('No profile data available', 'error');
            return;
        }

        const quickAddBtn = document.getElementById('xtrawrkx-quick-add-btn');
        const originalHtml = quickAddBtn ? quickAddBtn.innerHTML : '';
        if (quickAddBtn) {
            quickAddBtn.disabled = true;
            quickAddBtn.innerHTML = '<span>Adding…</span>';
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'IMPORT_CURRENT_PAGE',
                data: this.currentPageData,
            });

            if (response && response.success) {
                if (quickAddBtn) {
                    quickAddBtn.innerHTML = '<span>Added ✓</span>';
                    quickAddBtn.style.background = '#10b981';
                    quickAddBtn.style.color = 'white';
                    quickAddBtn.style.border = 'none';
                    setTimeout(() => {
                        quickAddBtn.innerHTML = originalHtml;
                        quickAddBtn.style.background = '';
                        quickAddBtn.style.color = '';
                        quickAddBtn.style.border = '';
                        quickAddBtn.disabled = false;
                    }, 3000);
                }

                // Use the returned entity directly — no extra API round-trip needed
                const createdEntity = response.data?.data;
                if (createdEntity?.id) {
                    this.currentExistingContact = createdEntity;
                    // Switch to existing contact view (has "View in CRM" button with direct link)
                    setTimeout(() => {
                        this.showNotification('Lead added! Click "View in CRM" to open it.', 'success');
                        this.showExistingLeadDetails(createdEntity, this.currentPageData?.data || {});
                    }, 200);
                } else {
                    this.showNotification('Lead added to CRM! Check the "Active" tab in Contacts.', 'success');
                }
            } else {
                throw new Error(response?.error || 'Import failed');
            }
        } catch (error) {
            this.showNotification(`Failed to add: ${error.message}`, 'error');
            if (quickAddBtn) {
                quickAddBtn.disabled = false;
                quickAddBtn.innerHTML = originalHtml;
            }
        }
    }

    async clearCachedData() {

        try {
            // Clear local storage
            await chrome.storage.local.clear();

            // Clear current page data
            this.currentPageData = null;
            this.currentExistingContact = null;

        } catch (error) {
            console.error('❌ Error clearing cached data:', error);
        }
    }

    async forceDataExtraction() {
        try {

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab && tab.url?.includes('linkedin.com')) {
                // Send message to content script to extract data immediately
                chrome.tabs.sendMessage(tab.id, {
                    type: 'EXTRACT_CURRENT_PAGE'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('❌ Error forcing data extraction:', chrome.runtime.lastError);
                        return;
                    }


                    if (response && response.success && response.data) {
                        this.currentPageData = response.data;
                        this.updateUI();
                    }
                });
            }
        } catch (error) {
            console.error('Failed to force data extraction:', error);
        }
    }

    async requestPageData() {
        try {

            // Get current tab URL first to check if it changed
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url || !tab.url.includes('linkedin.com')) {
                return;
            }

            const currentTabUrl = tab.url;
            
            // IMPORTANT: Check if URL has changed - if so, clear existing contact
            if (this.lastKnownUrl && currentTabUrl !== this.lastKnownUrl) {
                this.currentExistingContact = null;
                this.currentPageData = null;
            }
            
            this.lastKnownUrl = currentTabUrl;

            // Get page data from storage (set by background worker)
            const storageResult = await chrome.storage.local.get(['lastPageData', 'lastPageUrl', 'pageDataTimestamp']);

            if (storageResult.lastPageData) {
                const storedUrl = storageResult.lastPageData.url || storageResult.lastPageUrl;
                
                // Only use stored data if it matches current tab URL
                if (storedUrl === currentTabUrl) {

                    // Check if data is recent (within last 60 seconds)
                    const dataAge = Date.now() - (storageResult.pageDataTimestamp || 0);

                    if (dataAge < 60000) {
                        this.currentPageData = storageResult.lastPageData;
                        
                        // Check for existing contact if authenticated
                        if (this.isAuthenticated && storageResult.lastPageData.data) {
                            const pageDataInner = storageResult.lastPageData.data;
                            const linkedInUrl = pageDataInner.linkedInUrl || pageDataInner.profileUrl;
                            if (linkedInUrl) {
                                this.checkExistingContact(linkedInUrl).then((existingResult) => {
                                    if (existingResult && existingResult.exists) {
                                        this.showExistingLeadDetails(existingResult.contact, pageDataInner);
                                    } else {
                                        this.updateUI();
                                    }
                                }).catch(() => {
                                    this.updateUI();
                                });
                            } else {
                                this.updateUI();
                            }
                        } else {
                            this.updateUI();
                        }
                        return;
                    } else {
                    }
                } else {
                }
            } else {
            }

            // Request fresh data from content script
            chrome.tabs.sendMessage(tab.id, {
                type: 'EXTRACT_CURRENT_PAGE'
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Error sending message to content script:', chrome.runtime.lastError);
                    return;
                }


                if (response && response.success && response.data) {
                    this.currentPageData = response.data;
                    
                    // Check for existing contact if authenticated
                    if (this.isAuthenticated && response.data.data) {
                        const pageDataInner = response.data.data;
                        const linkedInUrl = pageDataInner.linkedInUrl || pageDataInner.profileUrl;
                        if (linkedInUrl) {
                            this.checkExistingContact(linkedInUrl).then((existingResult) => {
                                if (existingResult && existingResult.exists) {
                                    this.showExistingLeadDetails(existingResult.contact, pageDataInner);
                                } else {
                                    this.updateUI();
                                }
                            }).catch(() => {
                                this.updateUI();
                            });
                        } else {
                            this.updateUI();
                        }
                    } else {
                        this.updateUI();
                    }
                } else {
                }
            });
        } catch (error) {
            console.error('Failed to request page data:', error);
        }
    }

    // Set up automatic data refresh
    setupAutoRefresh() {

        // Track last known URL to detect changes
        this.lastKnownUrl = null;

        // Listen for storage changes (when new page data arrives)
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.lastPageData) {
                const newData = changes.lastPageData.newValue;
                const oldData = changes.lastPageData.oldValue;

                // Check if this is actually new data (different URL)
                const newUrl = newData?.url;
                const oldUrl = oldData?.url || this.lastKnownUrl;
                
                if (newData && newUrl && newUrl !== oldUrl) {
                    
                    // ALWAYS clear existing contact data when URL changes
                    this.currentExistingContact = null;
                    this.lastKnownUrl = newUrl;
                    
                    // Update with new data
                    this.currentPageData = newData;
                    
                    // Check if this contact exists in CRM
                    if (this.isAuthenticated && newData && newData.data) {
                        const linkedInUrl = newData.data.linkedInUrl || newData.data.profileUrl;
                        if (linkedInUrl) {
                            // Check for existing contact
                            this.checkExistingContact(linkedInUrl).then((result) => {
                                if (result && result.exists) {
                                    this.showExistingLeadDetails(result.contact, newData.data);
                                } else {
                                    this.updateUI();
                                }
                            }).catch(() => {
                                this.updateUI();
                            });
                        } else {
                            this.updateUI();
                        }
                    } else {
                        this.updateUI();
                    }
                } else if (newData) {
                    // Same URL but data might have been refreshed
                    this.currentPageData = newData;
                    if (newUrl) {
                        this.lastKnownUrl = newUrl;
                    }
                    this.updateUI();
                }
            }
        });

        // Monitor tab URL changes directly (more reliable)
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            // Only process if URL changed and it's a LinkedIn page
            if (changeInfo.url && tab.url && tab.url.includes('linkedin.com')) {
                // Get current active tab
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs && tabs.length > 0 && tabs[0].id === tabId) {
                        const currentUrl = tab.url;
                        if (currentUrl !== this.lastKnownUrl) {
                            this.lastKnownUrl = currentUrl;
                            
                            // Clear existing contact immediately
                            this.currentExistingContact = null;
                            this.currentPageData = null;
                            
                            // Request fresh data extraction
                            setTimeout(() => {
                                this.requestPageData();
                            }, 800);
                        }
                    }
                });
            }
        });

        // More aggressive periodic refresh every 2 seconds to catch URL changes
        setInterval(() => {
            this.checkAndRefreshIfUrlChanged();
        }, 2000);
    }

    async checkAndRefreshIfUrlChanged() {
        try {
            // Get current tab URL
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url || !tab.url.includes('linkedin.com')) {
                return;
            }

            const currentUrl = tab.url;
            
            // Check if URL has changed
            if (this.lastKnownUrl && currentUrl !== this.lastKnownUrl) {
                
                // FORCE clear existing contact data - this is critical!
                this.currentExistingContact = null;
                this.currentPageData = null;
                this.lastKnownUrl = currentUrl;
                
                // Immediately request fresh data
                await this.requestPageData();
            } else if (!this.lastKnownUrl) {
                // First time, just set it
                this.lastKnownUrl = currentUrl;
            }
        } catch (error) {
            console.error('Error checking URL change:', error);
        }
    }

    handleMessage(message, sender, sendResponse) {
        if (!message || !message.type) {
            console.warn('Received message without type:', message);
            sendResponse({ success: false, error: 'Invalid message format' });
            return;
        }

        switch (message.type) {
            case 'PAGE_DATA_UPDATED':
            case 'PAGE_DATA_FOR_SIDEBAR':
                const newData = message.data || message;
                const newUrl = newData.url || message.url;
                const oldUrl = this.currentPageData?.url || this.lastKnownUrl;
                
                // CRITICAL: Clear existing contact if URL changed
                if (oldUrl && newUrl && oldUrl !== newUrl) {
                    this.currentExistingContact = null;
                    this.currentPageData = null;
                    this.lastLinkedInSnapshot = null;
                    this.lastCapturedHtmlPayload = null;
                    this.lastCapturedStructured = null;
                    this.hideHtmlCapturePanel();
                }
                
                // Update last known URL
                if (newUrl) {
                    this.lastKnownUrl = newUrl;
                }
                
                // Format data properly
                const formattedData = newData.data ? newData : { data: newData, url: newUrl };
                this.currentPageData = formattedData;
                
                // If authenticated, check for existing contact
                if (this.isAuthenticated && formattedData.data) {
                    const linkedInUrl = formattedData.data.linkedInUrl || formattedData.data.profileUrl;
                    if (linkedInUrl) {
                        this.checkExistingContact(linkedInUrl).then((result) => {
                            if (result && result.exists) {
                                this.showExistingLeadDetails(result.contact, formattedData.data);
                            } else {
                                this.updateUI();
                            }
                        }).catch(() => {
                            this.updateUI();
                        });
                    } else {
                        this.updateUI();
                    }
                } else {
                    this.updateUI();
                }
                sendResponse({ success: true });
                break;

            case 'AUTH_STATUS_CHANGED':
                this.checkAuthStatus().then(() => {
                    this.updateUI();
                    sendResponse({ success: true });
                });
                break;

            case 'CLOSE_SIDEPANEL':
                // Close sidePanel when requested (e.g., when navigating away from LinkedIn)
                this.closeSidePanel(message.reason || 'requested');
                sendResponse({ success: true });
                break;

            default:
                // Don't show error for unknown message types - just log it
                sendResponse({ success: true, note: 'Message type not handled by sidebar' });
        }
    }

    showNotification(message, type = 'info') {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#dc2626' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize sidebar controller when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SidebarController();
    });
} else {
    new SidebarController();
}
