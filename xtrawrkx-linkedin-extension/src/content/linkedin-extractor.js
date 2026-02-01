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
            const selectors = {
                name: [
                    'h1.text-heading-xlarge',
                    'h1.break-words',
                    '.pv-text-details__left-panel h1',
                    '.ph5 h1'
                ],
                headline: [
                    '.text-body-medium.break-words',
                    '.pv-text-details__left-panel .text-body-medium',
                    '.ph5 .text-body-medium'
                ],
                location: [
                    '.text-body-small.inline.t-black--light.break-words',
                    '.pv-text-details__left-panel .text-body-small',
                    '.ph5 .text-body-small'
                ]
            };

            const data = {
                type: 'profile',
                url: window.location.href,
                data: {
                    name: this.getTextBySelectors(selectors.name),
                    headline: this.getTextBySelectors(selectors.headline),
                    location: this.getTextBySelectors(selectors.location),
                    profileUrl: window.location.href,
                    linkedInUrl: window.location.href
                }
            };

            // Extract profile photo
            const profilePhoto = this.getProfilePhoto();
            if (profilePhoto) {
                data.data.profilePhoto = profilePhoto;
            }

            // Extract about section - description is in a sibling element after div#about
            const about = this.extractAboutSection();
            if (about) {
                data.data.about = about;
                data.data.description = about; // Alias for compatibility
            } else {
            }

            // Extract ALL experiences and add to profile data
            const allExperiences = this.extractAllExperiences();
            data.data.allExperiences = allExperiences;
            data.data.experienceCount = allExperiences.length;

            // Set current experience (first one) for backward compatibility
            if (allExperiences.length > 0) {
                const currentExp = allExperiences[0];
                data.data.currentJobTitle = currentExp.jobTitle;
                data.data.currentCompany = currentExp.company || currentExp.companyName || '';
                data.data.jobTitle = currentExp.jobTitle; // Alias for compatibility

            } else {
            }

            // Extract activity feed and calculate compatibility score
            // Try to extract even if we're on the Activity tab
            try {
                const activityData = this.extractActivityFeed();
                if (activityData && activityData.dates && activityData.dates.length > 0) {
                    data.data.activityFeed = activityData.activities;
                    data.data.activityDates = activityData.dates;
                    data.data.compatibilityScore = this.calculateCompatibilityScore(activityData);
                } else {
                    data.data.compatibilityScore = null;
                    data.data.activityFeed = [];
                    data.data.activityDates = [];
                }
            } catch (error) {
                console.error('Error extracting activity feed:', error);
                data.data.compatibilityScore = null;
                data.data.activityFeed = [];
                data.data.activityDates = [];
            }


            // Debug: Show what name was extracted

            return data;
        }

        getProfilePhoto() {
            try {
                const selectors = [
                    '.pv-top-card-profile-picture__image',
                    '.profile-photo-edit__preview',
                    '.pv-top-card__photo img',
                    '.presence-entity__image'
                ];

                for (const selector of selectors) {
                    const img = document.querySelector(selector);
                    if (img && img.src && !img.src.includes('data:image') && !img.src.includes('ghost')) {
                        return img.src;
                    }
                }

                return null;
            } catch (error) {
                console.error('Error extracting profile photo:', error);
                return null;
            }
        }

        // Extract about/description section - description is in a sibling element after div#about
        extractAboutSection() {
            try {

                // Method 1: Find div#about and look for description in sibling elements
                const aboutDiv = document.querySelector('div#about');
                if (aboutDiv) {

                    // Look for the description in sibling elements after div#about
                    // The description is in a span[aria-hidden="true"] within a div with -webkit-line-clamp style
                    let currentElement = aboutDiv.nextElementSibling;
                    let attempts = 0;

                    // Check up to 10 siblings
                    while (currentElement && attempts < 10) {

                        // Look for span[aria-hidden="true"] with description text
                        const descriptionSpan = currentElement.querySelector('span[aria-hidden="true"]');
                        if (descriptionSpan && descriptionSpan.textContent && descriptionSpan.textContent.trim().length > 50) {
                            const text = descriptionSpan.textContent.trim();
                            return text;
                        }

                        // Also check for div with -webkit-line-clamp style (another indicator)
                        const lineClampDiv = currentElement.querySelector('div[style*="-webkit-line-clamp"]');
                        if (lineClampDiv) {
                            const text = lineClampDiv.textContent?.trim();
                            if (text && text.length > 50) {
                                return text;
                            }
                        }

                        // Check if the element itself has the description
                        if (currentElement.textContent && currentElement.textContent.trim().length > 50) {
                            // Look for span[aria-hidden="true"] within this element
                            const spans = currentElement.querySelectorAll('span[aria-hidden="true"]');
                            for (const span of spans) {
                                const text = span.textContent?.trim();
                                if (text && text.length > 50 && !text.includes('Show more') && !text.includes('Show less')) {
                                    return text;
                                }
                            }
                        }

                        currentElement = currentElement.nextElementSibling;
                        attempts++;
                    }
                } else {
                }

                // Method 2: Fallback to old selectors
                const fallbackSelectors = [
                    '#about ~ * span[aria-hidden="true"]',
                    '#about ~ * .inline-show-more-text span[aria-hidden="true"]',
                    '.pv-about-section .pv-about__summary-text',
                    '.pv-about__summary-text .inline-show-more-text__text',
                    '[data-field="about"] .inline-show-more-text__text',
                    'div[style*="-webkit-line-clamp"] span[aria-hidden="true"]'
                ];

                for (const selector of fallbackSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim().length > 50) {
                        const text = element.textContent.trim();
                        if (!text.includes('Show more') && !text.includes('Show less')) {
                            return text;
                        }
                    }
                }

                return null;
            } catch (error) {
                console.error('Error extracting about section:', error);
                return null;
            }
        }

        // Extract ALL experiences from the experience section
        extractAllExperiences() {
            try {

                // Debug: Check what experience-related elements exist on the page
                const experienceElements = document.querySelectorAll('*[id*="experience"], *[class*="experience"]');
                experienceElements.forEach((el, i) => {
                });

                // Also check for sections with "Experience" text
                const allSections = document.querySelectorAll('section, div');
                let experienceTextSections = 0;
                allSections.forEach(section => {
                    if (section.textContent && section.textContent.toLowerCase().includes('experience')) {
                        experienceTextSections++;
                        if (experienceTextSections <= 3) { // Log first 3 only
                        }
                    }
                });

                // Method 0: Target the exact structure - div#experience + sibling div with specific class > ul > li
                const experienceDiv = document.querySelector('div#experience');

                if (experienceDiv) {

                    // Look for the sibling div that contains the actual experience list
                    // The ul is not inside #experience div, but in a sibling div after it
                    const experienceContainer = experienceDiv.nextElementSibling;

                    if (experienceContainer) {

                        // Look for ul inside the container div
                        const experienceList = experienceContainer.querySelector('ul');

                        if (experienceList) {

                            // Get ALL li elements
                            const allExperienceItems = experienceList.querySelectorAll('li');

                            // Debug: Show first few li elements
                            for (let i = 0; i < Math.min(allExperienceItems.length, 3); i++) {
                                const li = allExperienceItems[i];
                            }

                            const experiences = [];

                            // Extract data from each experience item (handle grouped company positions)
                            let validExperienceIndex = 0;
                            let currentCompanyGroup = null;

                            for (let idx = 0; idx < allExperienceItems.length; idx++) {
                                const item = allExperienceItems[idx];

                                // Check if this is a company header (multiple positions at same company)
                                if (this.isCompanyHeader(item)) {
                                    currentCompanyGroup = this.extractCompanyFromHeader(item);
                                    // Reset company group if extraction failed
                                    if (!currentCompanyGroup || !currentCompanyGroup.name) {
                                        currentCompanyGroup = null;
                                    }
                                    continue;
                                }

                                // Check if this is a job description (skip it)
                                if (this.isJobDescription(item)) {
                                    continue;
                                }

                                const experienceData = this.extractSingleExperience(item, validExperienceIndex, currentCompanyGroup);
                                if (experienceData) {
                                    experiences.push({
                                        ...experienceData,
                                        index: validExperienceIndex,
                                        isCurrent: validExperienceIndex === 0 // First valid experience is current
                                    });
                                    validExperienceIndex++;
                                } else {
                                }
                            }

                            return experiences;
                        }
                    }
                }

                // Method 0.5: If nextElementSibling doesn't work, try to find any sibling div with ul
                if (experienceDiv) {
                    let sibling = experienceDiv.nextElementSibling;
                    let attempts = 0;

                    while (sibling && attempts < 5) { // Check up to 5 siblings

                        const ul = sibling.querySelector('ul');
                        if (ul) {
                            const lis = ul.querySelectorAll('li');

                            if (lis.length > 0) {

                                const experiences = [];
                                let validExperienceIndex = 0;
                                let currentCompanyGroup = null;

                                for (let idx = 0; idx < lis.length; idx++) {
                                    const item = lis[idx];

                                    // Check if this is a company header (multiple positions at same company)
                                    if (this.isCompanyHeader(item)) {
                                        currentCompanyGroup = this.extractCompanyFromHeader(item);
                                        // Reset company group if extraction failed
                                        if (!currentCompanyGroup || !currentCompanyGroup.name) {
                                            currentCompanyGroup = null;
                                        }
                                        continue;
                                    }

                                    // Check if this is a job description (skip it)
                                    if (this.isJobDescription(item)) {
                                        continue;
                                    }

                                    const experienceData = this.extractSingleExperience(item, validExperienceIndex, currentCompanyGroup);
                                    if (experienceData) {
                                        experiences.push({
                                            ...experienceData,
                                            index: validExperienceIndex,
                                            isCurrent: validExperienceIndex === 0
                                        });
                                        validExperienceIndex++;
                                    }
                                }

                                if (experiences.length > 0) {
                                    return experiences;
                                }
                            }
                        }

                        sibling = sibling.nextElementSibling;
                        attempts++;
                    }
                }

                // Fallback methods for other LinkedIn layouts
                return this.extractAllExperiencesFallback();

            } catch (error) {
                console.error('Error extracting all experiences:', error);
                return [];
            }
        }

        // Check if an experience item is a company header (for multiple positions at same company)
        isCompanyHeader(experienceItem) {
            try {
                const className = experienceItem.className || '';

                // Look for company header indicators in pvs-entity__sub-components
                if (className.includes('pvs-entity__sub-components')) {
                    const textContent = experienceItem.textContent || '';
                    const textLength = textContent.trim().length;

                    // Check if it contains company logo/name but no job title
                    const hasCompanyLogo = experienceItem.querySelector('img') ||
                        experienceItem.querySelector('.entity-image');
                    const hasJobTitle = experienceItem.querySelector('.mr1.hoverable-link-text.t-bold') ||
                        experienceItem.querySelector('.t-16.t-black.t-bold');


                    // Company headers have:
                    // 1. Company logo
                    // 2. Short text (< 300 chars)
                    // 3. Duration pattern (yrs/mos)
                    // 4. No job title structure
                    // 5. Often contains dates after company name

                    if (hasCompanyLogo && !hasJobTitle && textLength < 300) {
                        // Check for duration pattern (company headers have duration info)
                        const hasDuration = textContent.includes('yrs') || textContent.includes('mos') ||
                            textContent.includes('year') || textContent.includes('month');

                        if (hasDuration) {
                            return true;
                        }
                    }

                    // If it's very long text (>800 chars), it's likely a job description
                    if (textLength > 800) {
                        return false;
                    }
                }

                // Alternative check: Look for company name pattern without job structure
                const textContent = experienceItem.textContent || '';
                const hasCompanyPattern = textContent.includes('yrs') && textContent.includes('mos') &&
                    textContent.length < 200; // Company headers are usually short

                if (hasCompanyPattern && !experienceItem.querySelector('.mr1.hoverable-link-text.t-bold')) {
                    return true;
                }

                return false;

            } catch (error) {
                console.error('Error checking if company header:', error);
                return false;
            }
        }

        // Helper method to clean duplicated text (e.g., "VeeraVeera" -> "Veera")
        cleanDuplicatedText(text) {
            if (!text || text.length < 4) return text;

            // Check if the text is duplicated (first half equals second half)
            const halfLength = Math.floor(text.length / 2);
            const firstHalf = text.substring(0, halfLength);
            const secondHalf = text.substring(halfLength);

            if (firstHalf === secondHalf && firstHalf.length > 2) {
                return firstHalf;
            }

            // Check for common duplication patterns with spaces or separators
            const words = text.split(/[\s·]+/);
            if (words.length === 2 && words[0] === words[1] && words[0].length > 2) {
                return words[0];
            }

            return text;
        }

        // Extract company information from a company header
        extractCompanyFromHeader(headerItem) {
            try {

                let companyName = null;
                let companyLogo = null;

                // Extract company name - look for the main text that's not duration or dates
                const textContent = headerItem.textContent || '';

                const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    // Skip duration lines (contain yrs, mos, or years)
                    if (line.includes('yrs') || line.includes('mos') || line.includes('years') ||
                        line.includes('·') || line.length <= 2) {
                        continue;
                    }

                    // Skip date patterns (like "Jan 2024 - Present")
                    if (line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/) ||
                        line.match(/\d{4}/) || line.includes('Present') || line.includes('-')) {
                        continue;
                    }

                    // Skip location patterns
                    if (line.includes('India') || line.includes('Remote') || line.includes('On-site') ||
                        line.includes('Hybrid') || line.includes('Bengaluru') || line.includes('Karnataka')) {
                        continue;
                    }

                    // This should be the company name
                    companyName = this.cleanDuplicatedText(line);
                    break;
                }

                // Extract company logo
                const logoImg = headerItem.querySelector('img');
                if (logoImg && logoImg.src && !logoImg.src.includes('data:image') && !logoImg.src.includes('ghost')) {
                    companyLogo = logoImg.src;
                } else {
                }

                const result = {
                    name: companyName,
                    logo: companyLogo
                };

                return result;

            } catch (error) {
                console.error('Error extracting company from header:', error);
                return null;
            }
        }

        // Check if an experience item is a job description rather than a job position
        isJobDescription(experienceItem) {
            try {
                const className = experienceItem.className || '';
                const textContent = experienceItem.textContent || '';
                const textLength = textContent.trim().length;


                // Check if it's a pvs-entity__sub-components that contains a job description
                if (className.includes('pvs-entity__sub-components')) {
                    // Look for job structure indicators
                    const hasJobTitle = experienceItem.querySelector('.mr1.hoverable-link-text.t-bold') ||
                        experienceItem.querySelector('.t-16.t-black.t-bold') ||
                        experienceItem.querySelector('.pvs-entity__caption-wrapper .mr1.t-bold');

                    const hasCompanyLogo = experienceItem.querySelector('img') ||
                        experienceItem.querySelector('.entity-image');


                    // If it has job title structure, it's a position, not a description
                    if (hasJobTitle) {
                        return false;
                    }

                    // If it has company logo and short text with duration, it's a company header
                    if (hasCompanyLogo && textLength < 300 &&
                        (textContent.includes('yrs') || textContent.includes('mos'))) {
                        return false;
                    }

                    // If it's very long text without job structure or logo, it's likely a description
                    if (textLength > 500 && !hasJobTitle && !hasCompanyLogo) {
                        return true;
                    }

                    // If it's medium length text without clear structure, check content
                    if (textLength > 200 && !hasJobTitle && !hasCompanyLogo) {
                        // Look for description-like content
                        const hasDescriptionWords = textContent.toLowerCase().includes('responsible') ||
                            textContent.toLowerCase().includes('managed') ||
                            textContent.toLowerCase().includes('developed') ||
                            textContent.toLowerCase().includes('led') ||
                            textContent.toLowerCase().includes('achieved') ||
                            textContent.toLowerCase().includes('worked') ||
                            textContent.toLowerCase().includes('experience');

                        if (hasDescriptionWords) {
                            return true;
                        }
                    }
                }

                // Secondary check: Look for specific job description indicators
                if (className.includes('pvs-list__item--with-top-padding') &&
                    !className.includes('artdeco-list__item')) {
                    return true;
                }

                // Tertiary check: Very long text content (descriptions are usually much longer)
                if (textLength > 1000) {
                    const hasJobStructure = experienceItem.querySelector('.mr1.hoverable-link-text.t-bold') ||
                        experienceItem.querySelector('.t-16.t-black.t-bold') ||
                        experienceItem.querySelector('.pvs-entity__caption-wrapper .mr1.t-bold');

                    if (!hasJobStructure) {
                        return true;
                    }
                }

                // Check if it's nested under a job position (job descriptions are often sub-items)
                const parentLi = experienceItem.closest('li.artdeco-list__item');
                if (parentLi && parentLi !== experienceItem) {
                    return true;
                }

                return false;

            } catch (error) {
                console.error('Error checking if job description:', error);
                return false; // If error, assume it's a job position to be safe
            }
        }

        // Extract data from a single experience item
        extractSingleExperience(experienceItem, index, companyGroup = null) {
            try {

                let jobTitle = null;
                let company = null;
                let companyLogo = null;
                let duration = null;
                let location = null;

                // If we have a company group (multiple positions at same company), use it
                if (companyGroup) {
                    company = companyGroup.name;
                    companyLogo = companyGroup.logo;
                    if (companyLogo) {
                    }
                }

                // Method A: Try to find job title and company in specific elements first

                // Look for job title in common LinkedIn selectors (try both with and without nested spans)
                const jobTitleSelectors = [
                    '.mr1.hoverable-link-text.t-bold',
                    '.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]',
                    '.t-16.t-black.t-bold',
                    '.t-16.t-black.t-bold span[aria-hidden="true"]',
                    '.pvs-entity__caption-wrapper .mr1.t-bold',
                    '.pvs-entity__caption-wrapper .mr1.t-bold span[aria-hidden="true"]',
                    'div[data-field="title"] span[aria-hidden="true"]',
                    '.artdeco-entity-lockup__title span[aria-hidden="true"]'
                ];

                for (const selector of jobTitleSelectors) {
                    const element = experienceItem.querySelector(selector);
                    if (element && element.textContent?.trim()) {
                        let text = element.textContent.trim();

                        // Clean up duplicated text (e.g., "VeeraVeera" -> "Veera")
                        text = this.cleanDuplicatedText(text);

                        // Skip if it looks like duration, company info, or location
                        if (!text.includes('yrs') && !text.includes('mos') && !text.includes('·') &&
                            !text.match(/\d{4}/) && !text.includes('India') && !text.includes('Remote') &&
                            !text.includes('On-site') && !text.includes('Hybrid') && text.length > 3) {
                            jobTitle = text;
                            break;
                        } else {
                        }
                    }
                }

                // Look for company in common LinkedIn selectors (only if not from group)
                if (!company) {
                    const companySelectors = [
                        '.t-14.t-normal',
                        '.t-14.t-normal span[aria-hidden="true"]',
                        '.t-14.t-black--light',
                        '.t-14.t-black--light span[aria-hidden="true"]',
                        '.pvs-entity__caption-wrapper .t-14',
                        '.pvs-entity__caption-wrapper .t-14 span[aria-hidden="true"]',
                        'div[data-field="company"] span[aria-hidden="true"]',
                        '.artdeco-entity-lockup__subtitle span[aria-hidden="true"]'
                    ];

                    for (const selector of companySelectors) {
                        const element = experienceItem.querySelector(selector);
                        if (element && element.textContent?.trim() && element.textContent.trim() !== jobTitle) {
                            let text = element.textContent.trim();

                            // Clean up duplicated text
                            text = this.cleanDuplicatedText(text);

                            // Skip if it looks like duration, dates, or location
                            if (!text.includes('yrs') && !text.includes('mos') && !text.match(/\d{4}/) &&
                                !text.includes('Present') && !text.includes('India') && !text.includes('Remote') &&
                                !text.includes('On-site') && !text.includes('Hybrid') && !text.includes('Bengaluru') &&
                                text.length > 2) {
                                company = text.split('·')[0].trim(); // Remove "· Full-time" etc.
                                break;
                            } else {
                            }
                        }
                    }
                }

                // Look for company logo (only if not from group)
                if (!companyLogo) {
                    const logoSelectors = [
                        'img[alt*="logo"]',
                        'img[src*="company"]',
                        '.entity-image img',
                        '.artdeco-entity-lockup__image img',
                        '.pvs-entity__image img'
                    ];

                    for (const selector of logoSelectors) {
                        const logoImg = experienceItem.querySelector(selector);
                        if (logoImg && logoImg.src && !logoImg.src.includes('data:image') && !logoImg.src.includes('ghost')) {
                            companyLogo = logoImg.src;
                            break;
                        }
                    }
                }

                // Method B: Fallback to scanning all spans if structured approach didn't work
                if (!jobTitle || (!company && !companyGroup)) {

                    // Get all spans with aria-hidden="true"
                    const allSpans = experienceItem.querySelectorAll('span[aria-hidden="true"]');

                    // Extract job title and company from spans
                    for (let i = 0; i < allSpans.length; i++) {
                        const span = allSpans[i];
                        const text = span.textContent?.trim();

                        if (text && text.length > 2) {
                            // Skip obvious non-job-title content first
                            if (text.includes('yrs') || text.includes('mos') || text.includes('·') ||
                                text.match(/\d{4}/) || text.includes('Present') || text.includes('Full-time') ||
                                text.includes('Part-time') || text.includes('Remote') || text.includes('On-site') ||
                                text.includes('Hybrid') || text.includes('India') || text.includes('Bengaluru')) {
                                continue;
                            }

                            // Look for job title patterns (only if we don't have one yet)
                            if (!jobTitle) {
                                // Check if this looks like a job title
                                const isJobTitle = text.toLowerCase().includes('ceo') ||
                                    text.toLowerCase().includes('co-founder') ||
                                    text.toLowerCase().includes('founder') ||
                                    text.toLowerCase().includes('director') ||
                                    text.toLowerCase().includes('manager') ||
                                    text.toLowerCase().includes('lead') ||
                                    text.toLowerCase().includes('head') ||
                                    text.toLowerCase().includes('engineer') ||
                                    text.toLowerCase().includes('developer') ||
                                    text.toLowerCase().includes('analyst') ||
                                    text.toLowerCase().includes('consultant') ||
                                    text.toLowerCase().includes('specialist') ||
                                    text.toLowerCase().includes('coordinator') ||
                                    text.toLowerCase().includes('trainee') ||
                                    text.toLowerCase().includes('intern') ||
                                    text.toLowerCase().includes('mentor') ||
                                    text.toLowerCase().includes('expert') ||
                                    text.toLowerCase().includes('officer') ||
                                    text.toLowerCase().includes('advisor') ||
                                    text.toLowerCase().includes('chief') ||
                                    text.toLowerCase().includes('vice') ||
                                    text.toLowerCase().includes('senior') ||
                                    text.toLowerCase().includes('junior') ||
                                    text.toLowerCase().includes('associate') ||
                                    text.toLowerCase().includes('assistant');

                                if (isJobTitle) {
                                    jobTitle = this.cleanDuplicatedText(text);
                                } else {
                                }
                            }
                            // Look for company name (only if we don't have one from group and it's not the job title)
                            else if (!company && !companyGroup && text !== jobTitle) {
                                // This could be a company name if it's not already identified as something else
                                const cleanedText = this.cleanDuplicatedText(text);
                                company = cleanedText;
                            }
                            // Look for duration (contains years, months, or Present)
                            else if (!duration && (
                                text.includes('yrs') ||
                                text.includes('mos') ||
                                text.includes('Present') ||
                                text.match(/\d{4}.*\d{4}/) ||
                                text.match(/\d{4}.*Present/)
                            )) {
                                duration = text;
                            }
                            // Look for location
                            else if (!location && (
                                text.includes('Bengaluru') ||
                                text.includes('Karnataka') ||
                                text.includes('India') ||
                                text.includes('Remote') ||
                                text.includes(',')
                            )) {
                                location = text;
                            }
                        }
                    }
                }

                // If we still don't have company, look for it in company-specific spans
                if (!company) {
                    const companySpans = experienceItem.querySelectorAll('.t-14.t-normal span[aria-hidden="true"]');
                    for (const span of companySpans) {
                        const text = span.textContent?.trim();
                        if (text && text !== jobTitle) {
                            company = text.split('·')[0].trim(); // Remove "· Full-time"
                            break;
                        }
                    }
                }

                // Final result summary

                if (jobTitle || company) {
                    return {
                        jobTitle,
                        company,
                        companyLogo,
                        duration,
                        location
                    };
                }

                return null;

            } catch (error) {
                console.error(`Error extracting single experience ${index}:`, error);
                return null;
            }
        }

        // Fallback method for other LinkedIn layouts
        extractAllExperiencesFallback() {

            // Try data-field="experience" approach
            const experienceSection = document.querySelector('[data-field="experience"]');
            if (experienceSection) {
                const experienceItems = experienceSection.querySelectorAll('.pvs-list__outer-container > li');

                const experiences = [];
                for (let idx = 0; idx < experienceItems.length; idx++) {
                    const experienceData = this.extractSingleExperience(experienceItems[idx], idx);
                    if (experienceData) {
                        experiences.push({
                            ...experienceData,
                            index: idx,
                            isCurrent: idx === 0
                        });
                    }
                }
                return experiences;
            }

            return [];
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
                    case 'EXTRACT_CURRENT_PAGE':
                        const currentData = this.extractCurrentPageData();
                        sendResponse({
                            success: true,
                            data: currentData
                        });
                        break;

                    case 'GET_PAGE_DATA':
                    case 'GET_CURRENT_PAGE_DATA':
                        sendResponse({
                            success: true,
                            data: this.currentPageData
                        });
                        break;

                    case 'EXTRACT_SEARCH_RESULTS':
                        const searchData = this.extractSearchData();
                        sendResponse({
                            success: true,
                            data: searchData
                        });
                        break;

                    default:
                        sendResponse({ success: false, error: 'Unknown message type' });
                }
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

        // Extract activity feed dates from LinkedIn profile
        extractActivityFeed() {
            try {
                
                const activities = [];
                const dates = [];
                const seenDateTimes = new Set(); // To avoid exact duplicates (same datetime)

                // Method 1: Find all time elements first (most reliable)
                const allTimeElements = document.querySelectorAll('time[datetime], time');
                
                for (const timeEl of allTimeElements) {
                    try {
                        const dateTime = timeEl.getAttribute('datetime');
                        const textContent = timeEl.textContent?.trim() || timeEl.getAttribute('aria-label') || '';
                        
                        if (dateTime) {
                            const date = new Date(dateTime);
                            if (!isNaN(date.getTime())) {
                                // Use full datetime as key to allow multiple activities per day
                                if (!seenDateTimes.has(dateTime)) {
                                    seenDateTimes.add(dateTime);
                                    dates.push(date);
                                    activities.push({
                                        date: date,
                                        dateString: dateTime,
                                        text: textContent || '',
                                        type: 'post'
                                    });
                                }
                            }
                        } else if (textContent) {
                            const parsedDate = this.parseRelativeDate(textContent);
                            if (parsedDate) {
                                // Use ISO string as key to allow multiple activities per day
                                const dateKey = parsedDate.toISOString();
                                if (!seenDateTimes.has(dateKey)) {
                                    seenDateTimes.add(dateKey);
                                    dates.push(parsedDate);
                                    activities.push({
                                        date: parsedDate,
                                        dateString: parsedDate.toISOString(),
                                        text: textContent,
                                        type: 'post'
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error processing time element:', error);
                    }
                }

                // Method 2: Look for LinkedIn carousel structure (ul with li items containing activities)
                const carouselSelectors = [
                    'ul.artdeco-carousel_slider',
                    'ul[class*="carousel"]',
                    '.artdeco-carousel_slider',
                    '[class*="carousel_slider"]'
                ];

                let carouselItems = [];
                for (const selector of carouselSelectors) {
                    const carousels = document.querySelectorAll(selector);
                    if (carousels.length > 0) {
                        // Get all li items from all carousels
                        carousels.forEach(carousel => {
                            const items = carousel.querySelectorAll('li');
                            carouselItems.push(...Array.from(items));
                        });
                        if (carouselItems.length > 0) break;
                    }
                }


                // Method 3: Look for activity feed containers and extract dates from them
                const feedSelectors = [
                    '.feed-shared-update-v2',
                    '.feed-shared-update',
                    'article[data-urn*="activity"]',
                    'article',
                    '.update-components-actor',
                    '[data-urn*="activity"]',
                    '.feed-shared-update-list-carousel__item',
                    '.occludable-update'
                ];

                let activityElements = [];
                for (const selector of feedSelectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        activityElements = Array.from(elements);
                        break;
                    }
                }

                // Method 4: If on Activity tab, look for posts in the activity feed container
                if (activityElements.length === 0 && window.location.pathname.includes('/activity/')) {
                    const activityContainers = document.querySelectorAll('main article, main .feed-shared-update, main [data-urn*="activity"]');
                    if (activityContainers.length > 0) {
                        activityElements = Array.from(activityContainers);
                    }
                }

                // Combine carousel items and activity elements
                const allActivityElements = [...carouselItems, ...activityElements];

                // Extract dates from activity elements (if not already found via time elements)
                for (let i = 0; i < allActivityElements.length; i++) {
                    const element = allActivityElements[i];
                    try {
                        // Skip if we already have many dates
                        if (dates.length >= 100) {
                            break;
                        }
                        
                        if (i % 10 === 0 && i > 0) {
                        }

                        // Look for time element (including nested)
                        const timeElement = element.querySelector('time');
                        if (timeElement) {
                            const dateTime = timeElement.getAttribute('datetime');
                            const textContent = timeElement.textContent?.trim() || timeElement.getAttribute('aria-label') || '';
                            
                            if (dateTime) {
                                const date = new Date(dateTime);
                                if (!isNaN(date.getTime())) {
                                    // Use full datetime to allow multiple activities per day
                                    if (!seenDateTimes.has(dateTime)) {
                                        seenDateTimes.add(dateTime);
                                        dates.push(date);
                                        activities.push({
                                            date: date,
                                            dateString: dateTime,
                                            text: textContent || '',
                                            type: 'post'
                                        });
                                    }
                                }
                            } else if (textContent) {
                                const parsedDate = this.parseRelativeDate(textContent);
                                if (parsedDate) {
                                    // Use ISO string to allow multiple activities per day
                                    const dateKey = parsedDate.toISOString();
                                    if (!seenDateTimes.has(dateKey)) {
                                        seenDateTimes.add(dateKey);
                                        dates.push(parsedDate);
                                        activities.push({
                                            date: parsedDate,
                                            dateString: parsedDate.toISOString(),
                                            text: textContent,
                                            type: 'post'
                                        });
                                    }
                                }
                            }
                        }
                        
                        // If no time element found, look for all time elements within this container
                        if (!timeElement) {
                            const allTimesInElement = element.querySelectorAll('time');
                            for (const timeEl of allTimesInElement) {
                                const dateTime = timeEl.getAttribute('datetime');
                                const textContent = timeEl.textContent?.trim() || timeEl.getAttribute('aria-label') || '';
                                
                                if (dateTime) {
                                    const date = new Date(dateTime);
                                    if (!isNaN(date.getTime()) && !seenDateTimes.has(dateTime)) {
                                        seenDateTimes.add(dateTime);
                                        dates.push(date);
                                        activities.push({
                                            date: date,
                                            dateString: dateTime,
                                            text: textContent || '',
                                            type: 'post'
                                        });
                                    }
                                } else if (textContent) {
                                    const parsedDate = this.parseRelativeDate(textContent);
                                    if (parsedDate) {
                                        const dateKey = parsedDate.toISOString();
                                        if (!seenDateTimes.has(dateKey)) {
                                            seenDateTimes.add(dateKey);
                                            dates.push(parsedDate);
                                            activities.push({
                                                date: parsedDate,
                                                dateString: parsedDate.toISOString(),
                                                text: textContent,
                                                type: 'post'
                                            });
                                        }
                                    }
                                }
                            }
                        }

                        // Check for spans with time information (relative dates like "1d", "2d ago", etc.)
                        // Look deeper in nested structures, especially in carousel items
                        const dateSpans = element.querySelectorAll('span[aria-label*="ago"], span[class*="time"], span[data-test-id*="time"], span[class*="date"], span[aria-label*="hour"], span[aria-label*="day"], span[aria-label*="week"], span[aria-label*="month"], span[aria-label*="minute"]');
                        for (const span of dateSpans) {
                            const text = span.textContent?.trim() || span.getAttribute('aria-label') || '';
                            if (text && (text.includes('ago') || text.match(/\d+\s*(?:d|day|week|month|year|hour|minute)/i) || text.match(/^\d+d$/i) || text.match(/^\d+w$/i) || text.match(/^\d+mo$/i) || text.match(/^\d+h$/i) || text.match(/^\d+m$/i))) {
                                const parsedDate = this.parseRelativeDate(text);
                                if (parsedDate) {
                                    // Use ISO string to allow multiple activities per day
                                    const dateKey = parsedDate.toISOString();
                                    if (!seenDateTimes.has(dateKey)) {
                                        seenDateTimes.add(dateKey);
                                        dates.push(parsedDate);
                                        activities.push({
                                            date: parsedDate,
                                            dateString: parsedDate.toISOString(),
                                            text: text,
                                            type: 'post'
                                        });
                                    }
                                }
                            }
                        }

                        // Also check for nested feed-shared-update elements within carousel items
                        const nestedFeedElements = element.querySelectorAll('.feed-shared-update-v2, .feed-shared-update, article[data-urn*="activity"]');
                        for (const nestedElement of nestedFeedElements) {
                            const nestedTime = nestedElement.querySelector('time');
                            if (nestedTime) {
                                const dateTime = nestedTime.getAttribute('datetime');
                                const textContent = nestedTime.textContent?.trim() || nestedTime.getAttribute('aria-label') || '';
                                
                                    if (dateTime) {
                                        const date = new Date(dateTime);
                                        if (!isNaN(date.getTime())) {
                                            // Use full datetime to allow multiple activities per day
                                            if (!seenDateTimes.has(dateTime)) {
                                                seenDateTimes.add(dateTime);
                                                dates.push(date);
                                                activities.push({
                                                    date: date,
                                                    dateString: dateTime,
                                                    text: textContent || '',
                                                    type: 'post'
                                                });
                                            }
                                        }
                                    } else if (textContent) {
                                        const parsedDate = this.parseRelativeDate(textContent);
                                        if (parsedDate) {
                                            // Use ISO string to allow multiple activities per day
                                            const dateKey = parsedDate.toISOString();
                                            if (!seenDateTimes.has(dateKey)) {
                                                seenDateTimes.add(dateKey);
                                                dates.push(parsedDate);
                                                activities.push({
                                                    date: parsedDate,
                                                    dateString: parsedDate.toISOString(),
                                                    text: textContent,
                                                    type: 'post'
                                                });
                                            }
                                        }
                                    }
                            }
                            
                            // Also check spans within nested feed elements
                            const nestedSpans = nestedElement.querySelectorAll('span[aria-label*="ago"], span[aria-label*="hour"], span[aria-label*="day"], span[aria-label*="week"], span[aria-label*="month"]');
                            for (const span of nestedSpans) {
                                const text = span.textContent?.trim() || span.getAttribute('aria-label') || '';
                                if (text && (text.includes('ago') || text.match(/\d+\s*(?:d|day|week|month|year|hour|minute)/i) || text.match(/^\d+d$/i) || text.match(/^\d+w$/i) || text.match(/^\d+mo$/i) || text.match(/^\d+h$/i))) {
                                    const parsedDate = this.parseRelativeDate(text);
                                    if (parsedDate) {
                                        // Use ISO string to allow multiple activities per day
                                        const dateKey = parsedDate.toISOString();
                                        if (!seenDateTimes.has(dateKey)) {
                                            seenDateTimes.add(dateKey);
                                            dates.push(parsedDate);
                                            activities.push({
                                                date: parsedDate,
                                                dateString: parsedDate.toISOString(),
                                                text: text,
                                                type: 'post'
                                            });
                                        }
                                    }
                                }
                            }
                        }

                        // Also check the element's text content for relative dates (fallback)
                        const elementText = element.textContent || '';
                        const timePattern = /(\d+\s*(?:minute|hour|day|week|month|year)s?\s*ago|\d+d\s*ago|\d+w\s*ago|\d+mo\s*ago|just\s*now|yesterday|today|\d+d|\d+w|\d+mo|\d+h)/i;
                        const match = elementText.match(timePattern);
                        if (match && !timeElement && dateSpans.length === 0 && nestedFeedElements.length === 0) {
                            const parsedDate = this.parseRelativeDate(match[0]);
                            if (parsedDate) {
                                // Use ISO string to allow multiple activities per day
                                const dateKey = parsedDate.toISOString();
                                if (!seenDateTimes.has(dateKey)) {
                                    seenDateTimes.add(dateKey);
                                    dates.push(parsedDate);
                                    activities.push({
                                        date: parsedDate,
                                        dateString: parsedDate.toISOString(),
                                        text: match[0],
                                        type: 'post'
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error extracting activity from element:', error);
                    }
                }

                dates.sort((a, b) => b.getTime() - a.getTime());
                activities.sort((a, b) => b.date.getTime() - a.date.getTime());

                if (dates.length > 0) {
                }

                return {
                    activities: activities,
                    dates: dates,
                    count: dates.length
                };
            } catch (error) {
                console.error('Error extracting activity feed:', error);
                return null;
            }
        }

        // Parse relative dates like "2 days ago", "1 week ago", "3 months ago", "1d", "2d", etc.
        parseRelativeDate(text) {
            if (!text) return null;

            const now = new Date();
            const lowerText = text.toLowerCase().trim();

            const patterns = [
                { regex: /(\d+)\s*(?:minute|min)s?\s*ago/i, unit: 'minutes' },
                { regex: /(\d+)\s*(?:hour|hr)s?\s*ago/i, unit: 'hours' },
                { regex: /(\d+)\s*(?:day|d)s?\s*ago/i, unit: 'days' },
                { regex: /(\d+)\s*(?:week|wk|w)s?\s*ago/i, unit: 'weeks' },
                { regex: /(\d+)\s*(?:month|mo|m)s?\s*ago/i, unit: 'months' },
                { regex: /(\d+)\s*(?:year|yr|y)s?\s*ago/i, unit: 'years' },
                { regex: /^(\d+)d$/i, unit: 'days' }, // "1d", "2d", etc.
                { regex: /^(\d+)w$/i, unit: 'weeks' }, // "1w", "2w", etc.
                { regex: /^(\d+)mo$/i, unit: 'months' }, // "1mo", "2mo", etc.
                { regex: /^(\d+)h$/i, unit: 'hours' }, // "1h", "2h", etc.
                { regex: /^(\d+)m$/i, unit: 'minutes' }, // "1m", "2m", etc.
                { regex: /just\s*now|today/i, unit: 'now' },
                { regex: /yesterday/i, unit: 'yesterday' }
            ];

            for (const pattern of patterns) {
                const match = lowerText.match(pattern.regex);
                if (match) {
                    if (pattern.unit === 'now') {
                        return new Date(now);
                    } else if (pattern.unit === 'yesterday') {
                        const yesterday = new Date(now);
                        yesterday.setDate(yesterday.getDate() - 1);
                        return yesterday;
                    } else {
                        const value = parseInt(match[1]) || 1;
                        const date = new Date(now);

                        switch (pattern.unit) {
                            case 'minutes':
                                date.setMinutes(date.getMinutes() - value);
                                break;
                            case 'hours':
                                date.setHours(date.getHours() - value);
                                break;
                            case 'days':
                                date.setDate(date.getDate() - value);
                                break;
                            case 'weeks':
                                date.setDate(date.getDate() - (value * 7));
                                break;
                            case 'months':
                                date.setMonth(date.getMonth() - value);
                                break;
                            case 'years':
                                date.setFullYear(date.getFullYear() - value);
                                break;
                        }

                        return date;
                    }
                }
            }

            const absoluteDate = new Date(text);
            if (!isNaN(absoluteDate.getTime())) {
                return absoluteDate;
            }

            return null;
        }

        // Calculate compatibility score (1-100) based on activity consistency
        calculateCompatibilityScore(activityData) {
            try {
                if (!activityData || !activityData.dates || activityData.dates.length === 0) {
                    return null;
                }

                const dates = activityData.dates;
                const now = new Date();
                let score = 0;

                // Factor 1: Recency (40 points)
                const mostRecent = dates[0];
                const daysSinceLastActivity = Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
                
                let recencyScore = 0;
                if (daysSinceLastActivity <= 1) {
                    recencyScore = 40;
                } else if (daysSinceLastActivity <= 7) {
                    recencyScore = 35;
                } else if (daysSinceLastActivity <= 30) {
                    recencyScore = 25;
                } else if (daysSinceLastActivity <= 90) {
                    recencyScore = 15;
                } else if (daysSinceLastActivity <= 180) {
                    recencyScore = 8;
                } else {
                    recencyScore = Math.max(0, 5 - Math.floor(daysSinceLastActivity / 365));
                }
                score += recencyScore;

                // Factor 2: Frequency (30 points)
                if (dates.length >= 2) {
                    const timeSpans = [];
                    for (let i = 0; i < dates.length - 1; i++) {
                        const daysBetween = Math.floor((dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24));
                        timeSpans.push(daysBetween);
                    }
                    const avgDaysBetween = timeSpans.reduce((a, b) => a + b, 0) / timeSpans.length;
                    
                    let frequencyScore = 0;
                    if (avgDaysBetween <= 3) {
                        frequencyScore = 30;
                    } else if (avgDaysBetween <= 7) {
                        frequencyScore = 25;
                    } else if (avgDaysBetween <= 14) {
                        frequencyScore = 20;
                    } else if (avgDaysBetween <= 30) {
                        frequencyScore = 15;
                    } else if (avgDaysBetween <= 60) {
                        frequencyScore = 10;
                    } else {
                        frequencyScore = Math.max(0, 5 - Math.floor(avgDaysBetween / 90));
                    }
                    score += frequencyScore;
                } else {
                    score += 10;
                }

                // Factor 3: Consistency (20 points)
                if (dates.length >= 3) {
                    const timeSpans = [];
                    for (let i = 0; i < dates.length - 1; i++) {
                        const daysBetween = Math.floor((dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24));
                        timeSpans.push(daysBetween);
                    }
                    
                    const avg = timeSpans.reduce((a, b) => a + b, 0) / timeSpans.length;
                    const variance = timeSpans.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / timeSpans.length;
                    const stdDev = Math.sqrt(variance);
                    const coefficientOfVariation = avg > 0 ? stdDev / avg : 1;
                    
                    let consistencyScore = 0;
                    if (coefficientOfVariation <= 0.3) {
                        consistencyScore = 20;
                    } else if (coefficientOfVariation <= 0.5) {
                        consistencyScore = 15;
                    } else if (coefficientOfVariation <= 0.7) {
                        consistencyScore = 10;
                    } else {
                        consistencyScore = 5;
                    }
                    score += consistencyScore;
                } else {
                    score += 5;
                }

                // Factor 4: Volume (10 points)
                const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
                const recentActivities = dates.filter(d => d >= ninetyDaysAgo).length;
                
                let volumeScore = 0;
                if (recentActivities >= 20) {
                    volumeScore = 10;
                } else if (recentActivities >= 10) {
                    volumeScore = 8;
                } else if (recentActivities >= 5) {
                    volumeScore = 6;
                } else if (recentActivities >= 2) {
                    volumeScore = 4;
                } else if (recentActivities >= 1) {
                    volumeScore = 2;
                }
                score += volumeScore;

                score = Math.max(1, Math.min(100, Math.round(score)));

                return score;
            } catch (error) {
                console.error('Error calculating compatibility score:', error);
                return null;
            }
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
