/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const transcriptPath = path.join(
  process.env.USERPROFILE || '',
  '.cursor/projects/d-Work-WebFudge-Clients-Xtrawrkx-xtrawrkx-suits/agent-transcripts/7c21304d-c304-4e74-8fe6-2b71bdc00de2/7c21304d-c304-4e74-8fe6-2b71bdc00de2.jsonl',
);

const line = fs.readFileSync(transcriptPath, 'utf8').split('\n').find((l) => l.includes('data-scribe-recorder'));
if (!line) {
  console.error('line not found');
  process.exit(1);
}

const idx = line.indexOf('<html');
let html = line.slice(idx);
html = html.replace(/\\n/g, '\n').replace(/\\"/g, '"');
const endIdx = html.indexOf('</html>');
if (endIdx > 0) html = html.slice(0, endIdx + 7);

const outPath = path.join(__dirname, 'sample-profile.html');
fs.writeFileSync(outPath, html.slice(0, 1200000));
console.log('wrote', Math.min(html.length, 1200000), 'chars to', outPath);

const patterns = [
  'application/ld+json',
  'data-view-name',
  'text-heading-xlarge',
  'text-heading-large',
  'text-body-medium',
  '#experience',
  '#about',
  '#education',
  'followers',
  'connections',
  'inline-show-more',
  'pv-top-card',
  'profile-top-card',
  'aria-hidden="true"',
];

for (const pat of patterns) {
  const re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const c = (html.match(re) || []).length;
  if (c) console.log(pat, c);
}

// data-view-name values
const viewNames = [...html.matchAll(/data-view-name="([^"]+)"/g)].map((m) => m[1]);
const uniq = [...new Set(viewNames)];
console.log('data-view-name count', uniq.length);
console.log(uniq.slice(0, 40).join('\n'));
