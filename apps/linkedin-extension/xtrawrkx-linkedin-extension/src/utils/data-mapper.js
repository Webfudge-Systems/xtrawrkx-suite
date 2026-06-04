/**
 * Data Mapper for LinkedIn to CRM Schema Conversion
 * Maps LinkedIn profile and company data to XtraWrkx CRM format
 */
class DataMapper {
    /**
     * Map LinkedIn profile to Contact schema
     */
    mapProfileToContact(profileData, userId) {
        const names = this.parseFullName(profileData.fullName || profileData.name || '');

        // Get LinkedIn URL for placeholder email generation
        const linkedInUrl = profileData.linkedInUrl || profileData.profileUrl || profileData.linkedIn || '';

        // Derive currentCompany and currentJobTitle from experience array when not top-level fields
        if (!profileData.currentCompany && Array.isArray(profileData.experience) && profileData.experience.length > 0) {
            profileData = { ...profileData, currentCompany: profileData.experience[0].company || '' };
        }
        if (!profileData.currentJobTitle && Array.isArray(profileData.experience) && profileData.experience.length > 0) {
            profileData = { ...profileData, currentJobTitle: profileData.experience[0].title || '' };
        }

        // Generate placeholder email if email is missing but LinkedIn URL exists
        // LinkedIn profiles typically don't have public email addresses
        let email = profileData.email || '';
        if (!email && linkedInUrl) {
            // Extract LinkedIn profile ID or username from URL
            // Handle various LinkedIn URL formats:
            // - linkedin.com/in/username
            // - linkedin.com/pub/username
            // - www.linkedin.com/in/username
            const linkedInMatch = linkedInUrl.match(/linkedin\.com\/(?:in|pub)\/([^\/\?]+)/);
            if (linkedInMatch && linkedInMatch[1]) {
                // Create a placeholder email that indicates it's from LinkedIn
                // The sidebar UI recognizes @xtrawrkx.placeholder and shows "Add Email" instead
                const profileId = linkedInMatch[1].replace(/[^a-zA-Z0-9_-]/g, '_');
                email = `${profileId}@xtrawrkx.placeholder`;
            } else {
                // Fallback placeholder if we can't extract profile ID
                // Use a hash of the URL to create a unique identifier
                let urlHash = '';
                try {
                    // Simple hash function for URL
                    urlHash = linkedInUrl.split('').reduce((acc, char) => {
                        return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
                    }, 0).toString(36).replace('-', '');
                } catch (e) {
                    urlHash = 'unknown';
                }
                email = `${urlHash}@xtrawrkx.placeholder`;
            }
        }

        // Ensure email is never empty - use placeholder if still missing
        if (!email) {
            email = 'linkedin-noemail@xtrawrkx.placeholder';
        }

        const contactData = {
            firstName: names.firstName || profileData.firstName || '',
            lastName: names.lastName || profileData.lastName || '',
            email: email,
            phone: profileData.phone || '',
            // Prioritize currentJobTitle from selected experience, then headline, then jobTitle
            title: profileData.currentJobTitle || profileData.jobTitle || profileData.headline || '',
            department: profileData.department || '',
            linkedIn: linkedInUrl || '',
            twitter: profileData.twitter || '',
            source: 'EXTENSION',
            status: 'ACTIVE',
            // DECISION_MAKER for prospects with a company (set after company link is confirmed),
            // TECHNICAL_CONTACT (schema default) for standalone individuals.
            // Do NOT use PRIMARY_CONTACT here — without a company the Strapi controller
            // would demote ALL primary contacts across the entire CRM.
            role: 'TECHNICAL_CONTACT',
            assignedTo: userId || null,
            // Additional fields from LinkedIn
            address: profileData.location || '',
            description: profileData.description || profileData.about || '',
            // Note: leadCompany will be set by the import handler after company is created
        };

        return contactData;
    }

    /**
     * Map LinkedIn company page to Lead Company schema
     */
    mapCompanyToLeadCompany(companyData, userId) {
        return {
            companyName: companyData.name || companyData.companyName || '',
            industry: companyData.industry || '',
            website: companyData.website || '',
            phone: companyData.phone || '',
            email: companyData.email || '',
            address: this.formatAddress(companyData),
            city: companyData.city || '',
            state: companyData.state || '',
            country: companyData.country || '',
            zipCode: companyData.zipCode || '',
            employees: this.formatEmployeeCount(companyData.employees || companyData.size),
            founded: companyData.founded || companyData.foundedYear || '',
            description: companyData.description || companyData.about || '',
            linkedIn: companyData.linkedInUrl || companyData.companyUrl || window.location.href,
            twitter: companyData.twitter || '',
            source: 'SOCIAL_MEDIA',
            status: 'NEW',
            segment: 'WARM',
            assignedTo: userId || null,
            // Set initial scores
            score: 50, // Default lead score
            healthScore: 50, // Default health score
            dealValue: 0
        };
    }

    /**
     * Map profile's current company to Lead Company schema
     */
    mapProfileCompanyToLeadCompany(profileData, userId) {
        // Extract company info from profile; fall back to experience[0].company
        const companyName =
            profileData.currentCompany ||
            profileData.company ||
            (Array.isArray(profileData.experience) && profileData.experience.length > 0
                ? profileData.experience[0].company
                : '') ||
            '';

        if (!companyName) {
            return null;
        }

        return {
            companyName: companyName,
            industry: profileData.industry || 'Other', // Default industry if not available
            // Don't use profile description as company description - description belongs to contact only
            linkedIn: profileData.linkedInUrl || profileData.profileUrl || '',
            source: 'SOCIAL_MEDIA',
            status: 'NEW',
            segment: 'WARM',
            assignedTo: userId || null,
            score: 50,
            healthScore: 50,
            dealValue: 0
        };
    }

    /**
     * Map LinkedIn profile to Lead schema (for individual leads)
     */
    mapProfileToLead(profileData, userId) {
        const names = this.parseFullName(profileData.fullName || '');

        return {
            leadName: `${names.firstName} ${names.lastName}`.trim() || profileData.fullName || '',
            companyName: profileData.currentCompany || profileData.company || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            website: profileData.website || '',
            industry: profileData.industry || '',
            source: 'EXTENSION',
            status: 'NEW',
            assignedTo: userId || null,
            size: profileData.companySize || '',
            notes: this.generateNotesFromProfile(profileData)
        };
    }

    /**
     * Map search results to bulk import format
     */
    mapSearchResults(results, userId) {
        return results.map(result => {
            if (result.type === 'profile') {
                return {
                    type: 'contact',
                    data: this.mapProfileToContact(result.data, userId)
                };
            } else if (result.type === 'company') {
                return {
                    type: 'lead-company',
                    data: this.mapCompanyToLeadCompany(result.data, userId)
                };
            }
            return null;
        }).filter(Boolean);
    }

    // Helper methods
    parseFullName(fullName) {
        if (!fullName) return { firstName: '', lastName: '' };

        const parts = fullName.trim().split(' ');
        return {
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || ''
        };
    }

    formatAddress(companyData) {
        const addressParts = [
            companyData.address,
            companyData.street,
            companyData.location
        ].filter(Boolean);

        return addressParts.join(', ');
    }

    formatEmployeeCount(employees) {
        if (!employees) return '';

        // Convert LinkedIn employee ranges to standardized format
        const employeeMap = {
            '1-10': '1-10',
            '11-50': '11-50',
            '51-200': '51-200',
            '201-500': '201-500',
            '501-1000': '501-1000',
            '1001-5000': '1001-5000',
            '5001-10000': '5001-10000',
            '10000+': '10000+'
        };

        // Try to match common LinkedIn formats
        const employeeStr = employees.toString().toLowerCase();

        for (const [key, value] of Object.entries(employeeMap)) {
            if (employeeStr.includes(key.toLowerCase()) ||
                employeeStr.includes(value.toLowerCase())) {
                return value;
            }
        }

        // If it's a number, try to categorize it
        const num = parseInt(employees);
        if (!isNaN(num)) {
            if (num <= 10) return '1-10';
            if (num <= 50) return '11-50';
            if (num <= 200) return '51-200';
            if (num <= 500) return '201-500';
            if (num <= 1000) return '501-1000';
            if (num <= 5000) return '1001-5000';
            if (num <= 10000) return '5001-10000';
            return '10000+';
        }

        return employees.toString();
    }

    generateNotesFromProfile(profileData) {
        const notes = [];

        if (profileData.headline) {
            notes.push(`Headline: ${profileData.headline}`);
        }

        if (profileData.location) {
            notes.push(`Location: ${profileData.location}`);
        }

        if (profileData.experience && profileData.experience.length > 0) {
            notes.push(`Current Role: ${profileData.experience[0].title} at ${profileData.experience[0].company}`);
        }

        if (profileData.education && profileData.education.length > 0) {
            notes.push(`Education: ${profileData.education[0].school}`);
        }

        notes.push(`Imported from LinkedIn: ${new Date().toISOString()}`);

        return notes.join('\n');
    }

    /**
     * Validate required fields for different entity types
     */
    validateContact(contactData) {
        const errors = [];

        if (!contactData.firstName && !contactData.lastName) {
            errors.push('First name or last name is required');
        }

        if (!contactData.email && !contactData.linkedIn) {
            errors.push('Email or LinkedIn profile is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateLeadCompany(companyData) {
        const errors = [];

        if (!companyData.companyName) {
            errors.push('Company name is required');
        }

        // Industry is not always available from LinkedIn profiles, so make it optional
        // If not provided, we'll use a default or empty string

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateLead(leadData) {
        const errors = [];

        if (!leadData.leadName) {
            errors.push('Lead name is required');
        }

        if (!leadData.companyName) {
            errors.push('Company name is required');
        }

        if (!leadData.email) {
            errors.push('Email is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Export for use in different contexts
if (typeof window !== 'undefined') {
    window.DataMapper = DataMapper;
}

if (typeof self !== 'undefined') {
    self.DataMapper = DataMapper;
}

