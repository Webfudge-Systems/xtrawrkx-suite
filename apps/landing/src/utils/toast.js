import { toast } from 'react-toastify';

// Toast utility functions for consistent messaging across the app
export const toastUtils = {
    // Success toasts
    success: (message, options = {}) => {
        return toast.success(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options
        });
    },

    // Error toasts
    error: (message, options = {}) => {
        return toast.error(message, {
            position: "top-right",
            autoClose: 7000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options
        });
    },

    // Warning toasts
    warning: (message, options = {}) => {
        return toast.warning(message, {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options
        });
    },

    // Info toasts
    info: (message, options = {}) => {
        return toast.info(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options
        });
    },

    // Loading toast (returns toast ID for updating)
    loading: (message, options = {}) => {
        return toast.loading(message, {
            position: "top-right",
            closeOnClick: false,
            ...options
        });
    },

    // Update loading toast
    update: (toastId, type, message, options = {}) => {
        return toast.update(toastId, {
            render: message,
            type: type,
            isLoading: false,
            autoClose: type === 'error' ? 7000 : 5000,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options
        });
    },

    // Dismiss specific toast
    dismiss: (toastId) => {
        toast.dismiss(toastId);
    },

    // Dismiss all toasts
    dismissAll: () => {
        toast.dismiss();
    },

    // Promise-based toast for async operations
    promise: (promise, messages, options = {}) => {
        return toast.promise(
            promise,
            {
                pending: messages.pending || 'Processing...',
                success: messages.success || 'Operation completed successfully!',
                error: messages.error || 'Something went wrong!'
            },
            {
                position: "top-right",
                ...options
            }
        );
    }
};

// Pre-configured toast messages for common scenarios
export const commonToasts = {
    // Authentication
    loginSuccess: () => toastUtils.success("Successfully logged in! Welcome back."),
    loginError: () => toastUtils.error("Login failed. Please check your credentials and try again."),
    logoutSuccess: () => toastUtils.success("Successfully logged out. See you next time!"),

    // Registration
    registrationSuccess: (registrationId) =>
        toastUtils.success(
            `Registration completed successfully! Your registration ID is: ${registrationId}`,
            { autoClose: 10000 }
        ),
    registrationError: () => toastUtils.error("Registration failed. Please try again or contact support."),

    // Payment
    paymentSuccess: () => toastUtils.success("Payment completed successfully! You'll receive a confirmation email shortly."),
    paymentCancelled: () => toastUtils.warning("Payment was cancelled. Your registration has been saved."),
    paymentError: (error) => toastUtils.error(`Payment failed: ${error}. Please try again or contact support.`),

    // Form submissions
    formSuccess: () => toastUtils.success("Thank you! Your message has been sent successfully."),
    formError: () => toastUtils.error("Failed to send message. Please try again."),

    // Data operations
    saveSuccess: () => toastUtils.success("Changes saved successfully!"),
    saveError: () => toastUtils.error("Failed to save changes. Please try again."),
    deleteSuccess: () => toastUtils.success("Item deleted successfully!"),
    deleteError: () => toastUtils.error("Failed to delete item. Please try again."),

    // File uploads
    uploadSuccess: () => toastUtils.success("File uploaded successfully!"),
    uploadError: () => toastUtils.error("File upload failed. Please try again."),
    uploadProgress: () => toastUtils.loading("Uploading file..."),

    // Network/Connection
    networkError: () => toastUtils.error("Network error. Please check your connection and try again."),
    serverError: () => toastUtils.error("Server error. Please try again later."),

    // Validation
    validationError: (message) => toastUtils.warning(message || "Please check your input and try again."),

    // General
    somethingWentWrong: () => toastUtils.error("Something went wrong. Please try again later."),
    operationSuccess: () => toastUtils.success("Operation completed successfully!"),

    // Newsletter/Consultation
    consultationBooked: () => toastUtils.success("Consultation call booked successfully! You'll receive a confirmation email shortly."),
    newsletterSubscribed: () => toastUtils.success("Successfully subscribed to our newsletter!"),
    newsletterError: () => toastUtils.error("Failed to subscribe to newsletter. Please try again.")
};

// Toast configuration defaults
export const toastConfig = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    newestOnTop: false,
    closeOnClick: true,
    rtl: false,
    pauseOnFocusLoss: true,
    draggable: true,
    pauseOnHover: true,
    theme: "light",
    style: {
        fontSize: "14px",
        fontFamily: "var(--font-poppins, sans-serif)"
    }
};
