#!/usr/bin/env node

/**
 * Webfudge Platform - Setup Verification Script
 *
 * This script verifies that the project is properly set up and ready for development.
 *
 * Usage: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Helper functions
const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`),
};

// Check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Check if directory exists
const dirExists = (dirPath) => {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
};

// Verification checks
let passedChecks = 0;
let failedChecks = 0;
let warningChecks = 0;

const check = (condition, successMsg, errorMsg) => {
  if (condition) {
    log.success(successMsg);
    passedChecks++;
    return true;
  } else {
    log.error(errorMsg);
    failedChecks++;
    return false;
  }
};

const warn = (condition, msg) => {
  if (!condition) {
    log.warning(msg);
    warningChecks++;
  }
};

// Main verification
console.log(`
${colors.bold}${colors.cyan}╔════════════════════════════════════════════╗
║  Webfudge Platform Setup Verification     ║
╚════════════════════════════════════════════╝${colors.reset}
`);

// 1. Root Configuration
log.title('1. Root Configuration');
check(
  fileExists('package.json'),
  'package.json exists',
  'package.json not found'
);
check(
  fileExists('turbo.json'),
  'turbo.json exists',
  'turbo.json not found'
);
check(
  fileExists('.gitignore'),
  '.gitignore exists',
  '.gitignore not found'
);
check(
  fileExists('.prettierrc'),
  '.prettierrc exists',
  '.prettierrc not found'
);

// 2. Documentation
log.title('2. Documentation Files');
const docs = [
  'README.md',
  'GETTING_STARTED.md',
  'INSTALLATION.md',
  'QUICKSTART.md',
  'ARCHITECTURE.md',
  'COMMANDS.md',
  'ENVIRONMENT.md',
  'SETUP_SUMMARY.md',
  'PROJECT_CHECKLIST.md',
  'COMPLETION_REPORT.md',
];

docs.forEach((doc) => {
  check(
    fileExists(doc),
    `${doc} exists`,
    `${doc} not found`
  );
});

// 3. Apps Structure
log.title('3. Applications');
const apps = ['landing', 'crm', 'pm', 'accounts', 'vendor', 'backend'];

apps.forEach((app) => {
  const appPath = path.join('apps', app);
  if (check(
    dirExists(appPath),
    `${app} directory exists`,
    `${app} directory not found`
  )) {
    check(
      fileExists(path.join(appPath, 'package.json')),
      `  ${app}/package.json exists`,
      `  ${app}/package.json not found`
    );

    if (app !== 'backend') {
      // Next.js apps
      check(
        fileExists(path.join(appPath, 'next.config.js')),
        `  ${app}/next.config.js exists`,
        `  ${app}/next.config.js not found`
      );
      check(
        fileExists(path.join(appPath, 'tailwind.config.js')),
        `  ${app}/tailwind.config.js exists`,
        `  ${app}/tailwind.config.js not found`
      );
      check(
        dirExists(path.join(appPath, 'app')),
        `  ${app}/app directory exists`,
        `  ${app}/app directory not found`
      );
    } else {
      // Strapi backend
      check(
        fileExists(path.join(appPath, 'database.js')),
        `  ${app}/database.js exists`,
        `  ${app}/database.js not found`
      );
      check(
        fileExists(path.join(appPath, 'server.js')),
        `  ${app}/server.js exists`,
        `  ${app}/server.js not found`
      );
    }
  }
});

// 4. Packages Structure
log.title('4. Shared Packages');
const packages = ['ui', 'auth', 'billing', 'utils', 'config'];

packages.forEach((pkg) => {
  check(
    dirExists(path.join('packages', pkg)),
    `${pkg} package directory exists`,
    `${pkg} package directory not found`
  );
});

// 5. Tooling
log.title('5. Tooling Configuration');
check(
  dirExists('tooling/tsconfig'),
  'TypeScript config directory exists',
  'TypeScript config directory not found'
);
check(
  fileExists('tooling/tsconfig/base.json'),
  'TypeScript base config exists',
  'TypeScript base config not found'
);
check(
  fileExists('tooling/tsconfig/nextjs.json'),
  'TypeScript Next.js config exists',
  'TypeScript Next.js config not found'
);

// 6. Dependencies Check
log.title('6. Dependencies');
warn(
  dirExists('node_modules'),
  'node_modules not found - Run: npm install'
);

apps.forEach((app) => {
  warn(
    dirExists(path.join('apps', app, 'node_modules')),
    `apps/${app}/node_modules not found - Run: npm install`
  );
});

// 7. Environment Configuration
log.title('7. Environment Configuration');
warn(
  fileExists('apps/backend/.env'),
  'Backend .env not found - Copy .env.example and configure'
);

// 8. Build Artifacts
log.title('8. Build Status');
const buildDirs = [
  'apps/landing/.next',
  'apps/crm/.next',
  'apps/pm/.next',
  'apps/accounts/.next',
  'apps/vendor/.next',
  'apps/backend/.cache',
];

const builtApps = buildDirs.filter(dirExists).length;
if (builtApps === 0) {
  log.info('No build artifacts found (expected for fresh setup)');
} else if (builtApps === buildDirs.length) {
  log.success('All applications have been built');
} else {
  log.info(`${builtApps}/${buildDirs.length} applications built`);
}

// Summary
log.title('Verification Summary');
console.log(`Total Checks: ${passedChecks + failedChecks}`);
console.log(`${colors.green}Passed: ${passedChecks}${colors.reset}`);
console.log(`${colors.red}Failed: ${failedChecks}${colors.reset}`);
console.log(`${colors.yellow}Warnings: ${warningChecks}${colors.reset}`);

if (failedChecks === 0) {
  console.log(`
${colors.green}${colors.bold}╔════════════════════════════════════════════╗
║  ✓ Setup Verification Passed!             ║
╚════════════════════════════════════════════╝${colors.reset}
  `);

  if (warningChecks > 0) {
    console.log(`${colors.yellow}Note: There are ${warningChecks} warning(s) to address.${colors.reset}\n`);
  }

  log.info('Next Steps:');
  console.log('  1. Run: npm install');
  console.log('  2. Configure: apps/backend/.env');
  console.log('  3. Start: npm run dev');
  console.log('  4. Visit: http://localhost:1337/admin\n');

  process.exit(0);
} else {
  console.log(`
${colors.red}${colors.bold}╔════════════════════════════════════════════╗
║  ✗ Setup Verification Failed!             ║
╚════════════════════════════════════════════╝${colors.reset}
  `);

  log.error(`${failedChecks} critical check(s) failed.`);
  log.info('Please review the errors above and fix them.\n');

  process.exit(1);
}
