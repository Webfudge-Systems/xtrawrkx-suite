/**
 * Build script for production
 * Minifies and optimizes extension files
 */

const fs = require('fs');
const path = require('path');

// Simple build process - copy files to dist folder
// For production, you might want to use webpack or rollup for minification

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy files recursively
function copyRecursive(src, dest) {
    // Ensure destination directory exists
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            copyRecursive(srcPath, destPath);
        } else {
            // Ensure destination directory exists before copying file
            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            // Copy file only if source exists
            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
            } else {
                console.warn(`Warning: Source file not found: ${srcPath}`);
            }
        }
    }
}

// Copy source files
copyRecursive(srcDir, path.join(distDir, 'src'));

// Copy manifest
fs.copyFileSync(
    path.join(__dirname, '..', 'manifest.json'),
    path.join(distDir, 'manifest.json')
);

// Copy icons if they exist
const iconsDir = path.join(__dirname, '..', 'icons');
if (fs.existsSync(iconsDir)) {
    const iconsDestDir = path.join(distDir, 'icons');
    // Ensure destination directory exists
    if (!fs.existsSync(iconsDestDir)) {
        fs.mkdirSync(iconsDestDir, { recursive: true });
    }
    copyRecursive(iconsDir, iconsDestDir);
} else {
    console.warn('Warning: Icons directory not found');
}


