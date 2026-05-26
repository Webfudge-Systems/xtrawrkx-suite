// Email utility functions for event registration

/**
 * Send registration confirmation email
 * @param {Object} registrationData - Registration data from the form
 * @param {string} registrationId - The registration ID
 * @returns {Promise<boolean>} - Success status
 */
export const sendRegistrationEmail = async (registrationData, registrationId) => {
    try {
        const emailData = {
            registrationId,
            companyName: registrationData.companyName,
            primaryContactName: registrationData.primaryContactName,
            primaryContactEmail: registrationData.primaryContactEmail,
            companyEmail: registrationData.companyEmail,
            eventTitle: registrationData.eventTitle,
            eventDate: registrationData.eventDate,
            eventLocation: registrationData.eventLocation,
            ticketType: registrationData.ticketName || registrationData.ticketType,
            totalCost: registrationData.totalCost,
            paymentStatus: registrationData.paymentStatus,
        };

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'registration',
                data: emailData,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Failed to send email');
        }

        const result = await response.json();
        return true;

    } catch (error) {
        // Don't throw error to prevent registration failure due to email issues
        return false;
    }
};

/**
 * Send payment confirmation email
 * @param {Object} registrationData - Registration data 
 * @param {string} registrationId - The registration ID
 * @param {string} paymentId - The payment ID from payment gateway
 * @returns {Promise<boolean>} - Success status
 */
export const sendPaymentConfirmationEmail = async (registrationData, registrationId, paymentId) => {
    try {
        const emailData = {
            registrationId,
            companyName: registrationData.companyName,
            primaryContactName: registrationData.primaryContactName,
            primaryContactEmail: registrationData.primaryContactEmail,
            companyEmail: registrationData.companyEmail,
            eventTitle: registrationData.eventTitle,
            eventDate: registrationData.eventDate,
            eventLocation: registrationData.eventLocation,
            ticketType: registrationData.ticketName || registrationData.ticketType,
            totalCost: registrationData.totalCost,
            paymentId,
        };

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'payment_confirmation',
                data: emailData,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Failed to send email');
        }

        const result = await response.json();
        return true;

    } catch (error) {
        // Don't throw error to prevent payment completion failure due to email issues
        return false;
    }
};

/**
 * Send season registration email
 * @param {Object} registrationData - Season registration data
 * @param {string} registrationId - The registration ID
 * @param {string} season - Season information
 * @returns {Promise<boolean>} - Success status
 */
export const sendSeasonRegistrationEmail = async (registrationData, registrationId, season) => {
    try {
        // Prepare season-specific email data
        const emailData = {
            registrationId,
            companyName: registrationData.companyName,
            primaryContactName: registrationData.primaryContactName,
            primaryContactEmail: registrationData.primaryContactEmail,
            companyEmail: registrationData.companyEmail,
            eventTitle: `Season ${season} Events`,
            eventDate: 'Multiple Dates - Details will be sent separately',
            eventLocation: 'Various Locations',
            ticketType: registrationData.ticketName || registrationData.ticketType,
            totalCost: registrationData.totalCost,
            paymentStatus: registrationData.paymentStatus,
            season,
            selectedEvents: registrationData.selectedEventDetails || [],
        };

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'registration',
                data: emailData,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Failed to send email');
        }

        const result = await response.json();
        return true;

    } catch (error) {
        // Don't throw error to prevent registration failure due to email issues
        return false;
    }
};

/**
 * Send season payment confirmation email
 * @param {Object} registrationData - Season registration data
 * @param {string} registrationId - The registration ID
 * @param {string} paymentId - The payment ID
 * @param {string} season - Season information
 * @returns {Promise<boolean>} - Success status
 */
export const sendSeasonPaymentConfirmationEmail = async (registrationData, registrationId, paymentId, season) => {
    try {
        const emailData = {
            registrationId,
            companyName: registrationData.companyName,
            primaryContactName: registrationData.primaryContactName,
            primaryContactEmail: registrationData.primaryContactEmail,
            companyEmail: registrationData.companyEmail,
            eventTitle: `Season ${season} Events`,
            eventDate: 'Multiple Dates - Details will be sent separately',
            eventLocation: 'Various Locations',
            ticketType: registrationData.ticketName || registrationData.ticketType,
            totalCost: registrationData.totalCost,
            paymentId,
            season,
            selectedEvents: registrationData.selectedEventDetails || [],
        };

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'payment_confirmation',
                data: emailData,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Failed to send email');
        }

        const result = await response.json();
        return true;

    } catch (error) {
        // Don't throw error to prevent payment completion failure due to email issues
        return false;
    }
};
