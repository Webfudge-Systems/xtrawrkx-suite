// LinkedIn Data Extractor - Production Ready Version
if (typeof window.LinkedInExtractor === 'undefined') {
    class LinkedInExtractor {
        constructor() {
            this.logger = typeof getLogger !== 'undefined' ? getLogger() : null;
            if (this.logger) {
                this.logger.log('LinkedIn Extractor initialized');
            }
            this.currentPageData = null;
            this.setupExtractor();
        }

        setupExtractor() {
            this.injectToggleButton();
            this.observeUrlChanges();
            this.setupMessageListener();

            // Extract data immediately on load
            setTimeout(() => {
                if (this.logger) {
                    this.logger.log('Initial data extraction on page load...');
                }
                this.extractCurrentPageData();
                this.sendPageDataToSidebar();
            }, 2000);
        }

        injectToggleButton() {
            // Remove existing button
            const existingBtn = document.querySelector('.xtrawrkx-toggle-btn');
            if (existingBtn) {
                existingBtn.remove();
            }

            // Create toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'xtrawrkx-toggle-btn';
            toggleBtn.innerHTML = `
                <div class="xtrawrkx-btn-content">
                    <span class="xtrawrkx-btn-text">Xtrawrkx</span>
                </div>
            `;

            // Add click handler
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openSidePanel();
            });

            // Inject into page
            document.body.appendChild(toggleBtn);
            if (this.logger) {
                this.logger.log('Toggle button injected');
            }
        }

        openSidePanel() {
            if (this.logger) {
                this.logger.log('Opening sidePanel...');
            }

            // Check if extension context is valid
            if (!chrome.runtime?.id) {
                if (this.logger) {
                    this.logger.error('Extension context invalidated');
                }
                this.showNotification('Extension needs to be reloaded. Please refresh the page.', 'error');
                return;
            }

            // Send message to background script to open sidePanel
            chrome.runtime.sendMessage({
                type: 'OPEN_SIDEPANEL_WITH_GESTURE'
            }, (response) => {
                if (chrome.runtime.lastError) {
                    if (this.logger) {
                        this.logger.error('Runtime error:', chrome.runtime.lastError);
                    }
                    this.showNotification('Failed to open sidebar. Please try clicking the extension icon.', 'error');
                    return;
                }

                if (response && response.success) {
                    if (this.logger) {
                        this.logger.log('SidePanel opened successfully');
                    }
                    // Send current page data to sidebar
                    this.sendPageDataToSidebar();
                } else {
                    if (this.logger) {
                        this.logger.error('Failed to open sidePanel:', response?.error);
                    }
                    this.showNotification(response?.error || 'Failed to open sidebar', 'error');
                }
            });
        }

        observeUrlChanges() {
            this.lastUrl = window.location.href;
            this.urlChangeTimeout = null;
            this.checkInterval = null;

            // Function to handle URL change
            const handleUrlChange = (newUrl, reason = 'unknown') => {
                if (newUrl === this.lastUrl) return;
                
                if (this.logger) {
                    this.logger.log(`URL changed (${reason}):`, this.lastUrl, '→', newUrl);
                }
                
                const oldUrl = this.lastUrl;
                this.lastUrl = newUrl;

                // Clear previous data immediately
                this.currentPageData = null;

                // Clear any pending timeouts
                if (this.urlChangeTimeout) {
                    clearTimeout(this.urlChangeTimeout);
                }

                // Extract data after a short delay to allow page to render
                this.urlChangeTimeout = setTimeout(() => {
                    // Double-check URL hasn't changed again
                    if (window.location.href !== newUrl) {
                        if (this.logger) {
                            this.logger.log('URL changed again during delay, skipping extraction');
                        }
                        return;
                    }

                    if (this.logger) {
                        this.logger.log('Starting data extraction after URL change...');
                    }
                    
                    // Check if URL is still valid LinkedIn page
                    const pathname = window.location.pathname;
                    if (pathname.includes('/in/') || pathname.includes('/company/') || pathname.includes('/search/')) {
                        this.extractCurrentPageData();
                        this.sendPageDataToSidebar();
                    } else {
                        if (this.logger) {
                            this.logger.log('URL is not a profile, company, or search page - skipping extraction');
                        }
                    }
                }, 600); // Reduced to 600ms for faster response
            };

            // Bind handleUrlChange to this instance
            this.handleUrlChange = handleUrlChange.bind(this);

            // Method 1: Polling check (most reliable for LinkedIn SPA)
            this.checkInterval = setInterval(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== this.lastUrl) {
                    this.handleUrlChange(currentUrl, 'polling');
                }
            }, 500); // Check every 500ms

            // Method 2: MutationObserver for DOM changes
            const observer = new MutationObserver(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== this.lastUrl) {
                    this.handleUrlChange(currentUrl, 'mutation');
                }
            });

            // Observe with subtree for better detection
            observer.observe(document.body, {
                childList: true,
                subtree: true, // Changed to true for better detection
                attributes: false,
                characterData: false
            });

            // Method 3: Listen for popstate events (back/forward navigation)
            window.addEventListener('popstate', () => {
                setTimeout(() => {
                    const currentUrl = window.location.href;
                    if (currentUrl !== this.lastUrl) {
                        this.handleUrlChange(currentUrl, 'popstate');
                    }
                }, 100);
            });

            // Method 4: Intercept pushState (LinkedIn uses this for navigation)
            const originalPushState = history.pushState;
            const self = this;
            history.pushState = function (...args) {
                originalPushState.apply(history, args);
                setTimeout(() => {
                    const currentUrl = window.location.href;
                    if (currentUrl !== self.lastUrl) {
                        self.handleUrlChange(currentUrl, 'pushState');
                    }
                }, 100);
            };

            // Method 5: Intercept replaceState
            const originalReplaceState = history.replaceState;
            history.replaceState = function (...args) {
                originalReplaceState.apply(history, args);
                setTimeout(() => {
                    const currentUrl = window.location.href;
                    if (currentUrl !== self.lastUrl) {
                        self.handleUrlChange(currentUrl, 'replaceState');
                    }
                }, 100);
            };

            // Store observer for cleanup
            this.urlObserver = observer;

            if (this.logger) {
                this.logger.log('URL change observer setup complete (multiple methods: polling, mutation, popstate, pushState, replaceState)');
            }
        }

        extractCurrentPageData() {
            try {
                const pathname = window.location.pathname;
                let extractedData = null;

                // Check if we're on a profile page (including activity tab)
                if (pathname.includes('/in/') && !pathname.includes('/feed/')) {
                    if (this.logger) {
                        this.logger.log('Extracting profile data...');
                    }
                    extractedData = this.extractProfileData();
                } else if (pathname.includes('/company/')) {
                    if (this.logger) {
                        this.logger.log('Extracting company data...');
                    }
                    extractedData = this.extractCompanyData();
                } else if (pathname.includes('/search/')) {
                    if (this.logger) {
                        this.logger.log('Extracting search data...');
                    }
                    extractedData = this.extractSearchData();
                }

                this.currentPageData = extractedData;

                if (extractedData && this.logger) {
                    this.logger.log('Data extraction successful');
                }

                return extractedData;
            } catch (error) {
                if (this.logger) {
                    this.logger.error('Error extracting page data:', error);
                }
                return null;
            }
        }

        extractProfileData() {
            return {
                type: 'profile',
                url: window.location.href,
                data: {
                    profileUrl: window.location.href,
                    linkedInUrl: window.location.href,
                    pageTitle: document.title,
                },
            };
        }

        async captureProfileHtmlPayload() {
            if (typeof ProfilePageCapture === 'undefined') {
                throw new Error('ProfilePageCapture is not available');
            }
            await ProfilePageCapture.autoScrollForLazyContent(window, document);
            return ProfilePageCapture.buildSnapshotPayload(document, window);
        }


        extractCompanyData() {
            const selectors = {
                name: [
                    'h1.org-top-card-summary__title',
                    'h1.t-24.t-black.t-normal',
                    '.org-top-card-summary-info-list h1'
                ],
                industry: [
                    '.org-top-card-summary-info-list__info-item',
                    '.org-page-details__definition-text'
                ],
                website: [
                    'a[data-tracking-control-name="about_website"]',
                    '.org-about-us-organization-description__text a'
                ],
                about: [
                    '.org-about-us-organization-description__text',
                    '.break-words p'
                ],
                employees: [
                    '.org-about-company-module__company-staff-count-range',
                    '.t-black--light.text-align-left'
                ],
                location: [
                    '.org-top-card-summary-info-list .t-black--light',
                    '.org-locations'
                ]
            };

            const data = {
                type: 'company',
                url: window.location.href,
                data: {
                    name: this.getTextBySelectors(selectors.name),
                    companyName: this.getTextBySelectors(selectors.name),
                    industry: this.getTextBySelectors(selectors.industry),
                    about: this.getTextBySelectors(selectors.about),
                    description: this.getTextBySelectors(selectors.about),
                    employees: this.getTextBySelectors(selectors.employees),
                    location: this.getTextBySelectors(selectors.location),
                    companyUrl: window.location.href,
                    linkedInUrl: window.location.href
                }
            };

            // Extract website
            const websiteElement = this.getElementBySelectors(selectors.website);
            if (websiteElement) {
                data.data.website = websiteElement.href;
            }

            return data;
        }

        extractSearchData() {
            const searchType = this.getSearchType();
            const results = this.extractSearchResults(searchType);

            return {
                type: 'search',
                searchType: searchType,
                url: window.location.href,
                data: {
                    resultsCount: results.length,
                    results: results.slice(0, 10) // Limit to first 10 results
                }
            };
        }

        getSearchType() {
            const url = window.location.href;
            if (url.includes('people')) return 'people';
            if (url.includes('companies')) return 'companies';
            return 'mixed';
        }

        extractSearchResults(searchType) {
            const results = [];
            const resultCards = document.querySelectorAll('.reusable-search__result-container');

            resultCards.forEach((card, index) => {
                if (index >= 10) return; // Limit to 10 results

                const result = this.extractSingleSearchResult(card, searchType);
                if (result) {
                    results.push(result);
                }
            });

            return results;
        }

        extractSingleSearchResult(card, searchType) {
            try {
                const nameElement = card.querySelector('.entity-result__title-text a');
                const headlineElement = card.querySelector('.entity-result__primary-subtitle');
                const locationElement = card.querySelector('.entity-result__secondary-subtitle');

                return {
                    name: nameElement ? nameElement.textContent.trim() : null,
                    headline: headlineElement ? headlineElement.textContent.trim() : null,
                    location: locationElement ? locationElement.textContent.trim() : null,
                    profileUrl: nameElement ? nameElement.href : null,
                    type: searchType
                };
            } catch (error) {
                console.error('Error extracting search result:', error);
                return null;
            }
        }

        getTextBySelectors(selectors) {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }
            return null;
        }

        getElementBySelectors(selectors) {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element;
                }
            }
            return null;
        }

        sendPageDataToSidebar() {
            if (!chrome.runtime?.id) {
                if (this.logger) {
                    this.logger.warn('Extension context invalidated, cannot send data to sidebar');
                }
                return;
            }

            try {
                const currentUrl = window.location.href;
                const timestamp = Date.now();

                chrome.runtime.sendMessage({
                    type: 'PAGE_DATA_FOR_SIDEBAR',
                    data: this.currentPageData,
                    url: currentUrl,
                    timestamp: timestamp
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        if (this.logger) {
                            const errorMsg = chrome.runtime.lastError.message;
                            if (errorMsg.includes('Extension context invalidated')) {
                                this.logger.warn('Extension context invalidated - this is normal when reloading extension');
                            } else if (errorMsg.includes('Could not establish connection')) {
                                this.logger.warn('Could not establish connection - sidebar may not be open');
                            } else {
                                this.logger.error('Runtime error sending data to sidebar:', chrome.runtime.lastError);
                            }
                        }
                        return;
                    }

                    if (response && response.success && this.logger) {
                        this.logger.log('Page data sent to sidebar successfully');
                    }
                });
            } catch (error) {
                if (this.logger) {
                    this.logger.error('Error sending page data to sidebar:', error);
                }
            }
        }

        setupMessageListener() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                switch (message.type) {
                    case 'EXTRACT_CURRENT_PAGE': {
                        const currentData = this.extractCurrentPageData();
                        sendResponse({
                            success: true,
                            data: currentData
                        });
                        break;
                    }

                    case 'CAPTURE_PROFILE_HTML': {
                        (async () => {
                            try {
                                const pathname = window.location.pathname;
                                if (!pathname.includes('/in/') || pathname.includes('/feed/')) {
                                    sendResponse({
                                        success: false,
                                        error: 'Not a LinkedIn profile page',
                                    });
                                    return;
                                }
                                const payload = await this.captureProfileHtmlPayload();
                                sendResponse({ success: true, payload });
                            } catch (err) {
                                sendResponse({
                                    success: false,
                                    error: err?.message || String(err),
                                });
                            }
                        })();
                        return true;
                    }

                    case 'GET_PAGE_DATA':
                    case 'GET_CURRENT_PAGE_DATA':
                        sendResponse({
                            success: true,
                            data: this.currentPageData
                        });
                        break;

                    case 'EXTRACT_SEARCH_RESULTS': {
                        const searchData = this.extractSearchData();
                        sendResponse({
                            success: true,
                            data: searchData
                        });
                        break;
                    }

                    default:
                        sendResponse({ success: false, error: 'Unknown message type' });
                }
                return undefined;
            });
        }

        showNotification(message, type = 'info') {
            // Remove existing notification
            const existing = document.querySelector('.xtrawrkx-notification');
            if (existing) {
                existing.remove();
            }

            // Create notification
            const notification = document.createElement('div');
            notification.className = `xtrawrkx-notification ${type}`;
            notification.textContent = message;

            // Append to page
            document.body.appendChild(notification);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }

    }

    // Initialize the extractor when the page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.LinkedInExtractor = new LinkedInExtractor();
        });
    } else {
        window.LinkedInExtractor = new LinkedInExtractor();
    }
}
