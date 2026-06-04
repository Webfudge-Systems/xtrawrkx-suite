/**
 * API layer - Backward compatibility re-exports
 * This file re-exports functions from the new service structure
 * New code should import directly from the service files
 */

// Re-export auth functions
export {
    checkEmailExists,
    clientSignup,
    verifyOTP,
    login,
    getCurrentUser,
    logout
} from './api/authService.js';

// Re-export onboarding functions
export {
    getOnboardingAccount,
    saveOnboardingBasics,
    saveOnboardingCommunities,
    saveOnboardingSubmission,
    completeOnboarding
} from './api/onboardingService.js';
