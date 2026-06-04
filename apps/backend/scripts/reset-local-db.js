'use strict';

/**
 * Deletes the local SQLite database so the next `strapi develop` starts fresh.
 * Stop the backend dev server before running this script.
 */

const fs = require('fs');
const path = require('path');

const tmpDir = path.join(__dirname, '..', '.tmp');
const files = ['data.db', 'data.db-shm', 'data.db-wal'];

function removeFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      console.error(`\n❌ Could not delete ${filePath}`);
      console.error('   Stop the backend first: Ctrl+C on `npm run dev:backend`, then run this again.\n');
      process.exit(1);
    }
    throw error;
  }
}

console.log('\n🗑️  Resetting local SQLite database...\n');

let removed = 0;
for (const name of files) {
  const filePath = path.join(tmpDir, name);
  if (removeFile(filePath)) {
    console.log(`   ✓ Removed ${name}`);
    removed += 1;
  }
}

if (removed === 0) {
  console.log('   ℹ️  No database files found (already clean).');
} else {
  console.log(`\n✅ Removed ${removed} file(s).`);
}

console.log('\nNext steps:');
console.log('  1. npm run dev:backend   (recreates DB + runs seeds)');
console.log('  2. npm run dev           (restart frontend apps)');
console.log('  3. Orbit login: admin@xtrawrkx.com / XtrawrkxAdmin@2025\n');
