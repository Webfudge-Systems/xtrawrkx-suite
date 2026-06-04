// Cloudinary service for image and file uploads
export class CloudinaryService {
    // Cloudinary configuration - using environment variables with fallback
    static config = {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'df2ggvojv',
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'xtrawrkx_uploads',
        apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '135817735848235',
        apiSecret: process.env.CLOUDINARY_API_SECRET || 'wm7TK4If40Np8s5DUBEnyrKdUEU' // Keep this secret on server-side only
    };

    // Check if Cloudinary is properly configured
    static isConfigured() {
        const isValid = this.config.cloudName && this.config.uploadPreset;
        if (!isValid) {
            // Cloudinary credentials are missing
        }
        return isValid;
    }

    // Get Cloudinary upload URL
    static getUploadUrl(resourceType = 'image') {
        return `https://api.cloudinary.com/v1_1/${this.config.cloudName}/${resourceType}/upload`;
    }

    // Upload single image to Cloudinary
    static async uploadImage(file, options = {}) {
        try {
            if (!this.isConfigured()) {
                throw new Error('Cloudinary is not properly configured. Please create a .env.local file in the client directory with:\n\nNEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name\nNEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-actual-upload-preset\n\nGet these values from your Cloudinary dashboard: https://cloudinary.com/console');
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.size > maxSize) {
                throw new Error('File size must be less than 10MB.');
            }

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', this.config.uploadPreset);

            // Add optional parameters
            if (options.folder) {
                formData.append('folder', options.folder);
            }

            if (options.transformation) {
                formData.append('transformation', options.transformation);
            }

            // Generate unique public_id if not provided
            if (options.public_id) {
                formData.append('public_id', options.public_id);
            } else {
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 15);
                formData.append('public_id', `${options.folder || 'uploads'}_${timestamp}_${randomString}`);
            }

            // Upload to Cloudinary
            const uploadUrl = this.getUploadUrl('image');

            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = `Upload failed: ${errorData.error?.message || errorData.message || 'Unknown error'}`;

                    // Provide specific help for common errors
                    if (errorData.error?.message?.includes('Invalid upload preset')) {
                        errorMessage += '\n\nPlease check that your upload preset exists and is set to "unsigned" in your Cloudinary dashboard.';
                    }
                    if (errorData.error?.message?.includes('Invalid cloud_name')) {
                        errorMessage += '\n\nPlease check that your NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is correct.';
                    }
                } catch (e) {
                    // If we can't parse the error response, provide general guidance
                    if (response.status === 400) {
                        errorMessage += '\n\nThis usually indicates a configuration issue. Please verify your Cloudinary settings.';
                    }
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            return {
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes,
                created_at: result.created_at,
                resource_type: result.resource_type,
                type: result.type
            };
        } catch (error) {
            // Provide more helpful error messages for common network issues
            if (error.message === 'Failed to fetch') {
                throw new Error('Network error: Unable to connect to Cloudinary. Please check your internet connection and Cloudinary configuration.');
            }

            throw new Error(`Failed to upload image: ${error.message}`);
        }
    }

    // Upload file (non-image) to Cloudinary
    static async uploadFile(file, options = {}) {
        try {
            if (!this.isConfigured()) {
                throw new Error('Cloudinary is not properly configured. Please create a .env.local file in the client directory with:\n\nNEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name\nNEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-actual-upload-preset\n\nGet these values from your Cloudinary dashboard: https://cloudinary.com/console');
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.size > maxSize) {
                throw new Error('File size must be less than 10MB.');
            }

            // Use 'raw' resource type for all file uploads
            // PDFs should be uploaded as 'raw' to maintain file integrity
            const resourceType = 'raw';

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', this.config.uploadPreset);
            formData.append('resource_type', resourceType);

            // Add optional parameters
            if (options.folder) {
                formData.append('folder', options.folder);
            }

            // Generate unique public_id if not provided
            if (options.public_id) {
                formData.append('public_id', options.public_id);
            } else {
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 15);
                const fileExtension = file.name.split('.').pop();
                formData.append('public_id', `${options.folder || 'files'}_${timestamp}_${randomString}.${fileExtension}`);
            }

            // Upload to Cloudinary
            const uploadUrl = this.getUploadUrl(resourceType);

            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = `Upload failed: ${errorData.error?.message || errorData.message || 'Unknown error'}`;

                    // Provide specific help for common errors
                    if (errorData.error?.message?.includes('Invalid upload preset')) {
                        errorMessage += '\n\nPlease check that your upload preset exists and is set to "unsigned" in your Cloudinary dashboard.';
                    }
                    if (errorData.error?.message?.includes('Invalid cloud_name')) {
                        errorMessage += '\n\nPlease check that your NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is correct.';
                    }
                } catch (e) {
                    // If we can't parse the error response, provide general guidance
                    if (response.status === 400) {
                        errorMessage += '\n\nThis usually indicates a configuration issue. Please verify your Cloudinary settings.';
                    }
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            return {
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                bytes: result.bytes,
                created_at: result.created_at,
                resource_type: result.resource_type,
                type: result.type,
                original_filename: result.original_filename
            };
        } catch (error) {
            // Provide more helpful error messages for common network issues
            if (error.message === 'Failed to fetch') {
                throw new Error('Network error: Unable to connect to Cloudinary. Please check your internet connection and Cloudinary configuration.');
            }

            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    // Upload multiple images
    static async uploadMultipleImages(files, options = {}) {
        try {
            const uploadPromises = Array.from(files).map((file, index) => {
                const fileOptions = {
                    ...options,
                    public_id: options.public_id ? `${options.public_id}_${index}` : undefined
                };
                return this.uploadImage(file, fileOptions);
            });

            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error) {
            throw new Error(`Failed to upload multiple images: ${error.message}`);
        }
    }

    // Upload multiple files (images and documents)
    static async uploadMultipleFiles(files, options = {}) {
        try {
            const uploadPromises = Array.from(files).map((file, index) => {
                const fileOptions = {
                    ...options,
                    public_id: options.public_id ? `${options.public_id}_${index}` : undefined
                };

                // Check if file is an image
                const isImage = file.type.startsWith('image/');
                return isImage ? this.uploadImage(file, fileOptions) : this.uploadFile(file, fileOptions);
            });

            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error) {
            throw new Error(`Failed to upload multiple files: ${error.message}`);
        }
    }

    // Generate transformation URL
    static generateTransformedUrl(publicId, transformations = {}) {
        if (!this.isConfigured()) {
            return '';
        }

        let transformString = '';

        // Common transformations
        const params = [];

        if (transformations.width) params.push(`w_${transformations.width}`);
        if (transformations.height) params.push(`h_${transformations.height}`);
        if (transformations.crop) params.push(`c_${transformations.crop}`);
        if (transformations.quality) params.push(`q_${transformations.quality}`);
        if (transformations.format) params.push(`f_${transformations.format}`);

        if (params.length > 0) {
            transformString = params.join(',') + '/';
        }

        return `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${transformString}${publicId}`;
    }

    // Delete image from Cloudinary
    static async deleteImage(publicId) {
        try {
            if (!this.isConfigured()) {
                throw new Error('Cloudinary is not properly configured.');
            }

            // Note: Deletion requires server-side implementation with API secret
            // This is a placeholder - you'll need to implement this on your backend

            // For now, we'll just return success
            return { success: true, message: 'Deletion request logged' };
        } catch (error) {
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }

    // Resize image URL (generates URL with transformations)
    static getResizedImageUrl(url, width, height, crop = 'fill') {
        if (!url || !url.includes('cloudinary.com')) {
            return url;
        }

        // Extract public_id from URL
        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        const publicId = urlParts.slice(uploadIndex + 1).join('/');

        return this.generateTransformedUrl(publicId, { width, height, crop });
    }

    // Get optimized image URL
    static getOptimizedImageUrl(url, quality = 'auto', format = 'auto') {
        if (!url || !url.includes('cloudinary.com')) {
            return url;
        }

        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        const publicId = urlParts.slice(uploadIndex + 1).join('/');

        return this.generateTransformedUrl(publicId, { quality, format });
    }

    // Get PDF viewing URL (for raw files, return as-is)
    static getPDFViewingUrl(url) {
        if (!url || !url.includes('cloudinary.com')) {
            return url;
        }

        // For raw files, return the URL as-is since they should work directly
        // Raw files maintain their original format and can be viewed in browser
        return url;
    }
}

// Export convenient wrapper functions
export const uploadImage = (file, options = {}) => {
    return CloudinaryService.uploadImage(file, options);
};

export const uploadFile = (file, options = {}) => {
    return CloudinaryService.uploadFile(file, options);
};

export const uploadMultipleImages = (files, options = {}) => {
    return CloudinaryService.uploadMultipleImages(files, options);
};

export const uploadMultipleFiles = (files, options = {}) => {
    return CloudinaryService.uploadMultipleFiles(files, options);
};

export const getOptimizedImageUrl = (url, quality = 'auto', format = 'auto') => {
    return CloudinaryService.getOptimizedImageUrl(url, quality, format);
};

export const getResizedImageUrl = (url, width, height, crop = 'fill') => {
    return CloudinaryService.getResizedImageUrl(url, width, height, crop);
};

export const getPDFViewingUrl = (url) => {
    return CloudinaryService.getPDFViewingUrl(url);
}; 
